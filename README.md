
# Cards Eroding Humanity

### Overview

Cards Eroding Humanity is a mobile web app adaptation of the popular Cards Against Humanity tabletop game.
It is designed to be played directly with friends on a local wifi network, with access to a TV or monitor.

***

### Installation

#### Dependencies

1. `npm install`.
2. `bower install`.

__Note:__
The following global packages are required to complete a build:
  * `npm install -g bower`
  * `npm install -g grunt`
  * `npm install -g grunt-cli`
  * `gem install sass`



#### Crossbar

Crossbar is an open-source server platform that facilitates real-time communication via WebSockets. It implements the WAMP protocol, providing RPC and PubSub messaging patterns. It is required to provide communication between the client and server.

1. Run `pip install crossbar`
  * If pip command not recognised, install pip first via `easy_install pip`.

2. Run in project root. Will read config json file stored in '.crossbar'.


#### Getting up and running running:

Project currently requires three seperate components to be running. The fastest approach is to execute the following commands in seperate terminal windows:

1. `grunt serve`
  * Build and deploys angular bundles on a local webserver - Listening on 9000

2. `node server_ws.js` 
  * Listens on a port 9001 for web socket RPC & Pub/Sub communication.

3. `crossbar start`  
  * Starts crossbar WAMP/WS router:
  * Facilitates communication between all WAMP clients.

#### Starting a game

1. Ensure that the server processes are all running (as outlined above) 

2. Connect computer to a large monitor/tv
  * Navigate your browser to the tv view `serverip:9000/#/tv` 
  * Substitute the `serverip` for your own, reflecting the address of the computer where the server processes are running (i.e. 192.168.1.2)

3. Players use their mobile devices to connect to `serverip:9000/#`
  * The first player to connect sets up the game
  * Once set up, players will immediately be able to join

4. The game starts once all players have joined. Have fun!

***

### Configuration

In order to run on local network and allow for connections from other
devices, local IP addresses need to be updated in the following files:

1. CeH/server_ws.js
  * Update host & port for server-side web socket

2. CeH/app/scripts/app.js
  * Update host & port for client-side web socket (needs to mirror IP set on
the server side)

3. CeH/Gruntfile.js (Only if deploying running via `grunt serve`)
  *  Currently set to 0.0.0.0 by default. Only update if browser cannot access homepage. Grunt should also notify if there are any issues.

***

### Tech stack

Frontend:
* AngularJS
* AutobahnJS (Websocket)
* Sass
* Bootstrap 

Backend:
* Node
* Crossbar Messaging Router
* AutobahnJS (Websocket)
* Grunt

***

### License

This project is an adaptation on the Cards Against Humanity card game, licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported License.

Cards Eroding Humanity is not affiliated with Cards Against Humanity.

### Contributions & Thanks
* [Hunnymunch](http://www.github.com/hunnymunch) for helping with development
* Cards Against Humanity team for making an awesome game! 

***

### Screenshots
Selection of screenshots depicting the flow of the game:

<img src="http://static.mcdnnll.com/ceh/images/NewGame.jpg" alt="NewGame" width="250px"/>
<img src="http://static.mcdnnll.com/ceh/images/GameSetup.jpg" alt="GameSetup" width="250px"/>
<img src="http://static.mcdnnll.com/ceh/images/GameJoin.jpg" alt="JoinGame" width="250px"/>
<img src="http://static.mcdnnll.com/ceh/images/LoadGame.jpg" alt="LoadGame" width="250px"/>
<img src="http://static.mcdnnll.com/ceh/images/RevealQ.jpg" alt="Reveal" width="250px"/>
<img src="http://static.mcdnnll.com/ceh/images/SelectAnswer.jpg" alt="SelectAnswer" width="250px"/>
<img src="http://static.mcdnnll.com/ceh/images/TVQuestion.png" alt="TVQuestion" width="750px"/>
<img src="http://static.mcdnnll.com/ceh/images/SelectWinner.jpg" alt="SelectWinner" width="250px"/>
<img src="http://static.mcdnnll.com/ceh/images/Leaderboard.jpg" alt="Leaderboard" width="250px"/>
<img src="http://static.mcdnnll.com/ceh/images/GameInProgress.jpg" alt="GameInProgress" width="250px"/>

