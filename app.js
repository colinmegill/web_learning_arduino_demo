var express = require('express');
var io = require('socket.io');
var app = express();
var server = require('http').createServer(app);
var io = io.listen(server);
var five = require("johnny-five");
var board;
var servo;

// Store state of the system
// Here, state is the vector of light intensities
// with some discretization and bucketization
var STATE = [];

// What is the goal, which is the 
// sum of the intensities of the photo sensors
var GOAL = 30;

// And how far are we from the goal
var DISTANCE;

// Create Getopt instance, bind option 'help' to
// default action, and parse command line
opt = require('node-getopt').create([
  ['' , 'device=DEVICE'  , 'Which device to use'],
  ['',  'port=PORT'      , 'Which port to use'],
  ['h' , 'help'             , 'display this help'],
])
.bindHelp()
.parseSystem();

// Create a short cut to the arguments
var args = opt['options'];

// Which port to listen
server.listen(args['port']);
app.use(express.static(__dirname));

// Establish a connection to the board
board = new five.Board({
  port: args['device']
});

// When the board is ready, fire up this callback function
board.on("ready", function() {

  var range = [0, 100]

  photoresistorGreen = new five.Sensor({pin: "A0"});
  photoresistorYellow = new five.Sensor({pin: "A1"});
  photoresistorRed = new five.Sensor({pin: "A2"});
  photoresistorBlue = new five.Sensor({pin: "A3"});

  green = new five.Led({ pin: 11 })
  yellow = new five.Led({ pin: 10 })
  red = new five.Led({ pin: 6 })
  blue = new five.Led({ pin: 5 })

  board.repl.inject({
    green: green,
    yellow: yellow,
    red: red,
    blue: blue 
  });

  io.sockets.on('connection', function (socket){
    var check = setInterval(function(){
      console.log(STATE)
      SUM = STATE[0] + STATE[1] + STATE[2] + STATE[3]
      DISTANCE = Math.abs((GOAL - SUM)/GOAL)
      var penguin = {distance: DISTANCE, state: STATE};
      socket.emit('reading', penguin);
  
      green.brightness(Math.floor(Math.random()*255));
      yellow.brightness(Math.floor(Math.random()*255));
      red.brightness(Math.floor(Math.random()*255));
      blue.brightness(Math.floor(Math.random()*255));
  
    }, 250)
  })

  photoresistorGreen.scale(range).on("data", function() {
    STATE[0] = Math.floor(this.scaled);
  });

  photoresistorYellow.scale(range).on("data", function() {
    STATE[1] = Math.floor(this.scaled);
  });

  photoresistorRed.scale(range).on("data", function() {
    STATE[2] = Math.floor(this.scaled);
  });

  photoresistorBlue.scale(range).on("data", function() {
    STATE[3] = Math.floor(this.scaled);
  });

});
