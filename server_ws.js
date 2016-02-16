'use strict';

var autobahn = require('autobahn');
var log4js = require('log4js');
var config = require('config');

// Read CaH data into memory on startup
try {
	var globalQuestions = require('./card_data/general-questions.json');
	var globalAnswers = require('./card_data/general-answers.json');
	var globalAustraliaQuestions = require('./card_data/australia-questions.json');
	var globalAustraliaAnswers = require('./card_data/australia-answers.json');
} catch (e) {
	console.log(e);
}

/*========================================================================
 * Logger setup
 *========================================================================*/
log4js.loadAppender('console');
var logger = log4js.getLogger('Server');
logger.setLevel('TRACE');
logger.info('Server starting up...');

/*========================================================================
 * Global game object transmitted to all clients.
 *========================================================================*/
function GameConstructor(){

  // Maintain list and count of players in current game
  this.players = [];
  this.numPlayers = '';

  // Questioner/Leader and Question for the current game
	this.questioner = '';
	this.currentQuestion = {};

  // Flags to manage game's current state and view flow
	this.gameStatus = 'gameNone'; // gameNone, gameLoading, gameActive
	this.isNewQuestion = false;
	this.revealQuestion = false;

  // Current count of questions that have already been answered
	this.numAnswered = 0;

  // Collection of submitted answers that the questioner has yet to rate
	this.unratedAnswers = [];

  // Track count of answers that have already been rates
	this.numRated = 0;
  this.nextAnswerForRating = [];

  // Questioner rates answers as either good or bad, moving them from the
  // unratedAnswers array
  this.goodAnswers = [];
	this.badAnswers = [];

  // Retain winning player of the round and their answer
	this.gameWinner = '';
  this.winningAnswer = null;

	// Catch up mode allows a player who is alone in last position to catchup
  // by providing them with a score bonus if they win a subequent round
  this.bonus = false;
	this.isSoleLoser = 0;
	this.soleLoserName = '';

  // Flags to establish whether additional game options are active
  // within the current game
	this.betting = false;
	this.blanks = false;
}

var Game = new GameConstructor();
var backUpGame = new GameConstructor();

var questionPool = [];
var answerPool = [];
var cardsPerHand = 10;

//========================================================================
// Player class created for each new participant
//========================================================================

function Player(name){
	this.name = name;
	this.score = 0;
	this.lastRound = 0;
	this.confident = false;
	this.hasAnswered = 'danger';
	this.answers = [];
	this.betting = 0;
	this.rejoin = false;
}

//========================================================================
// Helper methods used in RPC calls
//========================================================================


// Randomly assign a new questioner who is not currently in the role
function assignQuestioner() {
	var currentQuestioner = Game.questioner;
	do {
		Game.questioner = Game.players[Math.floor(Math.random() * Game.numPlayers)].name;
	}
	while (Game.questioner === currentQuestioner);

	logger.debug('assignQuestioner: ', Game.questioner);
}

// Randomly pick a question for the new rount
function selectNewQuestion() {
  Game.currentQuestion = questionPool.splice(Math.floor(Math.random() * questionPool.length), 1)[0];
	Game.isNewQuestion = true;
}

// Determine if there are more than one players that are currently
// in last position on the leaderboard
function checkSoleLoser(){
  logger.debug('checkSoleLoser(): Creating new player array');
  var players = [];

	Game.players.forEach(function(player){
		players.push(player);
	});

  // Sort players based on their score
	players.sort(function(a,b){ return a.score - b.score});

  if (players[0].score < players[1].score && players[0].name !== Game.questioner){
		logger.debug(players[0].name , ' is on lowest score alone');
		Game.isSoleLoser = 1;
		Game.soleLoserName = players[0].name;
	}else{
    logger.debug(players[0].name , ' is not on lowest score alone');
		Game.isSoleLoser = 0;
		Game.soleLoserName = '';
	}
}

// Initialise game ready for a new round
function newRound(){

  // TODO: find out what this is supposed to be achieving
	backUpGame = JSON.parse(JSON.stringify(Game));

  logger.debug('newRound(): entered');

  // Init game state
  Game.numAnswered = 0;
	Game.unratedAnswers = [];
	Game.nextAnswerForRating = {};
	Game.goodAnswers = [];
	Game.badAnswers = [];
	selectNewQuestion();

  // Determine whether a losing player is eligble for bonues points
  // in the new round
  if (Game.bonus) {
    logger.debug('Calling checkSoleLoser()');
		checkSoleLoser();
	}

	Game.players.forEach(function(player){
		player.rejoin = false;
		player.lastRound = 0;
	});

	logger.debug('newRound(): returned');
}

/**
 *  Create seperate pools of available questions and
 *  answers drawn directly from global Question/Answer object.
 *  Questions and answers are removed from their respective
 *  pool once allocated to a player/questioner.
 */
function poolQuestions() {
  logger.trace('poolQuestions(): entered');
  questionPool.length = 0;

  // TODO: Refactor
	for (var q in globalQuestions) {
		questionPool.push(globalQuestions[q]);
	}

	for (var q in globalAustraliaQuestions) {
		questionPool.push(globalAustraliaQuestions[q]);
	}

  logger.trace('poolQuestions(): returned');
}

function poolAnswers() {
  logger.trace('poolAnswers(): entered');
	answerPool.length = 0;

  // TODO: Refactor
	for (var a in globalAnswers) {
		answerPool.push(globalAnswers[a]);
	}
	for (var a in globalAustraliaAnswers) {
		answerPool.push(globalAustraliaAnswers[a]);
	}

  logger.trace('poolAnswers(): returned');
}

/**
 * Randomly select answers from the answer pool based on the requirement
 * TODO: Stop allocating answers to questioners
 */
function allocateAnswers(numAnswers) {

	var newAnswers = [];

	// Replenish answer pool if not enough answers available
	if (answerPool.length <= numAnswers) {
		poolAnswers();
	}

	// Loop based on number of required answers (ie. 10 initially, 1/round thereafter)
	for (var i = 0; i < numAnswers; i++) {

		var answer;

		if (Math.random() >= 0.95 && Game.bonus){
			answer = {text: 'BLANK'};
		}else {
			// Select answer at random, remove from answer pool and store in player array
			answer = answerPool.splice(Math.floor(Math.random() * answerPool.length), 1)[0];
		}

		newAnswers.push(answer);
	}
	return newAnswers;
}


//========================================================================
// Websocket Initialisation
//========================================================================

var connection = new autobahn.Connection({
    /**
     * Update IP to reflect machine's network ip address.
     */
    url: 'ws://' + config.host +':' + config.ports.wsserver + '/ws',
    realm: 'realm1'}
);

connection.onopen = function (session){

	//========================================================================
	// RPC CALLS
	//========================================================================
	/**
	 * On opening a connection with the WAMP router, the following
	 * RPC methods are registered:
	 * -- setUpGame
	 * -- getGame
	 * -- registerPlayer
	 * -- questionerChosen
	 * -- revealQuestion
	 * -- submitAnswer
	 * -- rateAnswer
	 * -- chooseWinner
	 * -- quitGame
	 * Client invokes remote procedures with required params.
	 */

	// ------------------------------------------------------------
	// Set Up new game, set player numbers
	// ------------------------------------------------------------

	function setUpGame(args, kwargs, details){
		Game = new GameConstructor();
		Game.numPlayers = args[0];
    if (args[1]) {Game.bonus = true;}
		if (args[2]) {Game.betting = true;}
		if (args[3]) {Game.blanks = true;}
		Game.gameStatus = 'gameLoading';
		poolQuestions();
		poolAnswers();
		session.publish('WAMPGameUpdate', [Game]);
	}

	// Register RPC
	session.register('setUpGame', setUpGame).then(
		function (registration){
			logger.info('setUpGame procedure registered');
		},
		function (error){
			logger.fatal('setUpGame procedure could not be registered');
		}
	);


	// ------------------------------------------------------------
	// TODO: getGame - not sure if required. Used in game service because of async, but looks weird
	// ------------------------------------------------------------
	function getGame(args, kwargs, details){
		return Game;
	}

	// Register RPC
	session.register('getGame', getGame).then(
		function (registration){
			logger.info('getGame procedure registered');
		},
		function (error){
			logger.fatal('getGame procedure could not be registered');
		}
	);


	// ------------------------------------------------------------
	// Reset round
	// ------------------------------------------------------------

	function resetRound(args, kwargs, details){
		logger.debug('Round has been reset');

		Game.players.forEach(function(player){
			player.rejoin = false;
		});

		Game = backUpGame;
		Game.gameStatus = 'gameReset';

		session.publish('WAMPGameUpdate', [Game]);
	}

	// Register RPC
	session.register('resetRound', resetRound).then(
		function (registration){
			logger.info('registerPlayer procedure registered');
		},
		function (error){
			logger.fatal('registerPlayer procedure could not be registered');
		}
	);


	// ------------------------------------------------------------
	// Player rejoin
	// ------------------------------------------------------------

	function playerRejoin(args, kwargs, details){
		logger.debug(args[0], ' has rejoined the game');

		var ready = true;
		Game.players.forEach(function(player){
			if (player.name === args[0]){
				player.rejoin = true;
			}
			if (player.rejoin === false){
				ready = false;
			}
		});
		if (ready){
			Game.gameStatus = 'gameActive';
		}

		session.publish('WAMPGameUpdate', [Game]);
	}

	// Register RPC
	session.register('playerRejoin', playerRejoin).then(
		function (registration){
			logger.info('registerPlayer procedure registered');
		},
		function (error){
			logger.fatal('registerPlayer procedure could not be registered');
		}
	);


	// ------------------------------------------------------------
	// Register new player
	// ------------------------------------------------------------

	function registerPlayer(args, kwargs, details){
		var name = args[0];
		var newPlayer = new Player(name);
		//
		//if (name === 'A'){
		//	newPlayer.score = 10;
		//}
		//if (name === 'B'){
		//	newPlayer.score = 5;
		//}

		//newPlayer.score = 3;

		Game.players.push(newPlayer);

		// Check whether all players have joined
		if (Game.numPlayers == Game.players.length) {
			logger.info('All players have joined');
			Game.gameStatus = 'gameActive';
			assignQuestioner();
			// Allocate answers to all players
			for (var player in Game.players) {
				var allotedAnswers = allocateAnswers(cardsPerHand);
				Game.players[player].answers = Game.players[player].answers.concat(allotedAnswers);
			}
		}

		session.publish('WAMPGameUpdate', [Game]);
	}

	// Register RPC
	session.register('registerPlayer', registerPlayer).then(
		function (registration){
            logger.info('registerPlayer procedure registered');
		},
		function (error){
            logger.fatal('registerPlayer procedure could not be registered');
		}
	);




	// ------------------------------------------------------------
	// Notification that tv has finished pretending to select questioner
	// ------------------------------------------------------------
	function questionerChosen(args, kwargs, details){
        logger.debug('TvLeaderboard finish "choosing" questioner');
		Game.winningAnswer = null;
        Game.numRated = 0;
		newRound();
		session.publish('WAMPGameUpdate', [Game]);
	}

	session.register('questionerChosen', questionerChosen).then(
		function (registration){
            logger.info('questionerChosen procedure registered');
		},
		function (error){
            logger.fatal('questionerChosen procedure could not be registered');
		}
	);


	// ------------------------------------------------------------
	// Reveal question for players to see
	// ------------------------------------------------------------

	function revealQuestion(args, kwargs, details){
        logger.debug('revealQuestion');
		Game.revealQuestion = true;
		Game.isNewQuestion = false;
		session.publish('WAMPGameUpdate', [Game]);
	}

	session.register('revealQuestion', revealQuestion).then(
		function (registration){
            logger.info('revealQuestion procedure registered');
		},
		function (error){
			logger.log('revealQuestion procedure could not be registered');
		}
	);


	// ------------------------------------------------------------
	// Process player answers
	// ------------------------------------------------------------

	function submitAnswer(args, kwargs, details){

		var playerName = args[0];
		var playerAnswersIndexArray = args[1];
		var bonusFlag = args[2];
		var confidenceFlag = args[3];
		var blankInputArray = args[4];

		console.log(playerName , ' has sent playerAnswersIndexArray: ', playerAnswersIndexArray);
		console.log(playerName , ' has sent blankInputArray: ', blankInputArray);


		var playerAnswersArray = [];

        logger.debug(playerAnswersIndexArray);

		Game.players.forEach(function (player){
			if (player.name === playerName) {



				// Change status of player to reflect they have chosen an answer

				if (!bonusFlag) {
					player.hasAnswered = 'success';
					player.confident = confidenceFlag;
				}

				playerAnswersIndexArray.forEach(function (index){

					logger.debug(player.name + ' has answered ', player.answers[index].text);
					logger.debug('index ', index);

					if (player.answers[index].text === 'BLANK'){
						player.answers[index].text = blankInputArray.shift();
						logger.debug(playerName , ' \'s blank answer being substituted by: ', player.answers[index].text);
					}

					// Build player answers array
					playerAnswersArray.push(player.answers[index]);

					// Remove answer from player's answer pool
					player.answers.splice(index, 1);
				});

				// Replenish player answer pool
				if (!bonusFlag) {
					allocateAnswers(Game.currentQuestion.numAnswers).forEach(function (newAnswer){
						player.answers.unshift(newAnswer);
						logger.debug(playerName, ' has been allocated: ', newAnswer.text);
					});
					if (playerName === Game.soleLoserName){
						allocateAnswers(Game.currentQuestion.numAnswers).forEach(function (newAnswer){
							player.answers.unshift(newAnswer);
							logger.debug(playerName, ' has been allocated: ', newAnswer.text);
						});
					}
				}

				logger.debug(playerName, ' \'s final answerArray: ', playerAnswersArray);
			}
		});

		//Add player's answer to unratedAnswers array
		Game.numAnswered++;
		Game.unratedAnswers.push({playerName: playerName, playerAnswersArray: playerAnswersArray});

		// Check if everyone answered, then shift first unratedAnswer into nextAnswerForRating
		if (Game.numAnswered == (Game.numPlayers - 1 + Game.isSoleLoser)) {
            logger.debug('SubmitAnswer: Everyone has now answered');
            Game.nextAnswerForRating = Game.unratedAnswers.splice([Math.floor(Math.random() * Game.unratedAnswers.length - 1)], 1)[0];
		}
		session.publish('WAMPGameUpdate', [Game]);
	}

	// Register RPC
	session.register('submitAnswer', submitAnswer).then(
		function (registration){
            logger.info('submitAnswer procedure registered');
		},
		function (error){
            logger.fatal('submitAnswer procedure could not be registered');
		}
	);

	// ------------------------------------------------------------
	// Process questioner's answer rating
	// ------------------------------------------------------------

	function rateAnswer(args, kwargs, details){
		Game.numRated++;
		Game.revealQuestion = false;
		if (args[0] === 'good') {
			Game.goodAnswers.push(Game.nextAnswerForRating);
		} else {
			Game.badAnswers.push(Game.nextAnswerForRating);
		}

		// Prepare next answer for questioner to rate
		if (Game.numRated < (Game.numPlayers - 1 + Game.isSoleLoser)) {
			Game.nextAnswerForRating = Game.unratedAnswers.splice([Math.floor(Math.random() * Game.unratedAnswers.length - 1)], 1)[0];
		}
		session.publish('WAMPGameUpdate', [Game]);
	}

	session.register('rateAnswer', rateAnswer).then(
		function (registration){
            logger.info('rateAnswer procedure registered');
		},
		function (error){
            logger.fatal('rateAnswer procedure could not be registered');
		}
	);

	// ------------------------------------------------------------
	// Process questioner's answer rating
	// ------------------------------------------------------------
	function chooseWinner(args, kwargs, details){
        logger.debug('WINNER:', args[0]);
		Game.winningAnswer = args[0];

		var winningPlayer = null;

		Game.players.forEach(function (player){
			player.hasAnswered = 'danger';
            if (player.name === Game.winningAnswer.playerName) {
				winningPlayer = player;
	            winningPlayer.score++;
	            winningPlayer.lastRound++;
                logger.debug('Winning player is: ' , winningPlayer.name);
			}
		});

		if (winningPlayer.confident){
			Game.players.forEach(function(losingPlayer){
				if (losingPlayer.confident && losingPlayer.name !== winningPlayer.name && Game.questioner !== losingPlayer.name){
					winningPlayer.score++;
					winningPlayer.lastRound++;
					losingPlayer.score--;
					losingPlayer.lastRound--;
                    logger.debug(winningPlayer.name, ' is getting ' , losingPlayer.name, '\'s confidence point');
					losingPlayer.confident = false;
				}
			});
			winningPlayer.confident = false;
		}

		assignQuestioner();
		session.publish('WAMPGameUpdate', [Game]);
		return true;
	}

	session.register('chooseWinner', chooseWinner).then(
		function (registration){
            logger.info('chooseWinner procedure registered');
		},
		function (error){
            logger.fatal('chooseWinner procedure could not be registered');
		}
	);

	// ------------------------------------------------------------
	// Destroy current instance of the game
	// ------------------------------------------------------------

	function quitGame(args, kwargs, details){
		Game = new GameConstructor();
		session.publish('WAMPGameUpdate', [Game]);
	}
	session.register('quitGame', quitGame).then(
		function (registration){
            logger.info('quitGame procedure registered');
		},
		function (error){
            logger.fatal('quitGame procedure could not be registered');
		}
	);
};
connection.open();
logger.info('Server connection open...');
