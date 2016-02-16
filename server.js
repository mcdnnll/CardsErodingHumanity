'use strict';
var config = require('config');
var express = require('express');

// Basic Node server to access static assets
var app = express();
app.use(express.static(__dirname + '/dist'));
app.listen(config.ports.webserver, config.host);
