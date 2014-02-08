var express = require('express');
var io = require('socket.io');
var _ = require('underscore');
var app = express();
var server = require('http').createServer(app);
var io = io.listen(server);
var five = require("johnny-five");
var board;
var servo;
var util = require('util');
var spawn = require('child_process').spawn;

// Spawn the learner with the following input arguments
// NOTE: -u is supposed to treat streams unbuffered
var qlearner = spawn('python', [
    'qlearner.py',
    '--actions'         ,'0,1','0,-1','1,1','1,-1','2,1','2,-1','3,1','3,-1',
    '--nStateDims'      ,'4',
    '--epsilon'         ,'0.2',
    '--learnRate'       ,'0.5',
    '--discountRate'    ,'0.5',
    '--replayMemorySize','100',
    '--saveModel'       ,'model.json']) 

var learnTracker = {
    nEpisodesPlayed : 0,
    cumulativeReward : 0,
    nStatesExplored : 0,
    pastEpisodes : {
      reward2episode : [],
      distanceMat : []
    }
};

// Store state of the system.
// Here, state is the vector of light intensities
// with some discretization and bucketization
var state    = [0,0,0,0];

// The raw state is same as the state, but no
// discretization or bucketization has been added
var rawState = [0,0,0,0];

// What is the goal, which is the 
// sum of the intensities of the photo sensors
var goal = 20;

// And how far are we from the goal
var relDistance;

// How close we should get in order to get reward?
var relDistanceTh = 0.05;

// Jow much brightness is added/removed per action
var deltas = [30,30,30,30];

// We will store the minimum and maximum readings of the photo sensors
// so that our scaling eliminates the ambient lighting.
var minReading = 20;
var maxReading = 120;

// How many buckets per scaled reading? 
//var minBucket = 0;
//var maxBucket = 9;

var scaledSensorReading = function(x) {

  //var val = Math.floor( (maxBucket - minBucket) * 
  //			( x - minReading ) / 
  //			( maxReading - minReading ) + 
  //			minBucket );

  var val = x - minReading;

  val = val < 0 ? 0 : val;
  val = val > maxReading ? maxReading : val;
    
  val /= 12;

  return val;

};

// Reward the player more the faster it gets to the right solution
var getReward = function(nActions) {
  return 1 * Math.exp( - 0.01 * ( nActions - 1 ) );
};

var processDeltaAction = function(actionStr) {

    // Which LED are we going to touch?
    var pinID  = parseInt(actionStr.split(',')[0]);

    // Are we increasing or decreasing the brightness?
    var sign = parseInt(actionStr.split(',')[1]);

    // What is the new brightness value?
    var newBrightness = leds[pinID].value + sign * deltas[pinID];

    newBrightness = Math.max( 0, Math.min( newBrightness , 255 ) );

    // Assign the LED new brightness value 
    leds[pinID].brightness( newBrightness );
};

// Turn all LEDs OFF.
var resetLEDs = function() {

  leds[0].brightness(0);
  leds[1].brightness(0);
  leds[2].brightness(0);
  leds[3].brightness(0);

};

qlearner.stdin.on('end', function(){
  process.stdout.write('qlearner stream ended.');
});

qlearner.on('exit', function(code){
  process.exit(code);
});

qlearner.stderr.on('data', function (data) {
  console.log('python stderr: ' + data);
})

/* this data will be piped to a more appropriate place */
qlearner.stdout.on('data', function (buffer) {

  // Convert string to utf-8 and remove newline character
  var lines = buffer.toString('utf8').split('\n');
  
  for ( var i = 0; i < lines.length; ++i ) {
    
    var line = lines[i];
      
    if ( line === undefined || line.length === 0 ) {
      continue;
    }

    // Action is the first element in the field
    var actionID = line.split(' ')[0];
    
    // If it's a delta action
    if ( actionID === 'DELTA_ACTION' ) {
      	    
      // Extract the action string...
      var actionStr = line.split(' ')[1];
    
      // ... and pass to the processor
      // leds will be modified
      processDeltaAction(actionStr);

    } else if ( actionID === "INFO" ) {
	    
      var info = JSON.parse( line.substr(5) );

      learnTracker.nStatesExplored = info.nStatesExplored;

      // Add learn tracker and send to browser

    } else {

      console.log("Erroneous line: " + line + '\n');
      process.exit(1);

    }

  }

  console.log(lines + '\n');

}); 

// Create Getopt instance, bind option 'help' to
// default action, and parse command line
opt = require('node-getopt').create([
  ['f', 'updateFreq=FREQ', 'Update frequency (Hz) of the system'],
  ['d', 'device=DEVICE'  , 'Which device to use'],
  ['p', 'port=PORT'      , 'Which port to use'],
  ['h', 'help'           , 'display this help'],
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

  // Indicate where the sensors sit on the board
  sensorGreen  = new five.Sensor({pin: "A0"});
  sensorYellow = new five.Sensor({pin: "A1"});
  sensorRed    = new five.Sensor({pin: "A2"});
  sensorBlue   = new five.Sensor({pin: "A3"});

  // Collect the sensors into an array
  sensors = [sensorGreen, sensorYellow, sensorRed, sensorBlue ]

  // Indicate where the LEDs sit on the board
  ledGreen  = new five.Led({ pin: 11 })
  ledYellow = new five.Led({ pin: 10 })
  ledRed    = new five.Led({ pin: 6  })
  ledBlue   = new five.Led({ pin: 5  })

  // Collect the LEDs into an array
  leds = [ledGreen,ledYellow,ledRed,ledBlue];

  // Indicate which variables are seen in the REPL
  board.repl.inject({
    green:   ledGreen,
    yellow:  ledYellow,
    red:     ledRed,
    blue:    ledBlue,
    leds:    leds,
    sensors: sensors
  });

  // We reset the LEDs in case they are lit
  resetLEDs();

  // We will get the minimum intensity reading now that all LEDs are off.
  // This minimum intensity corresponds to the surrounding lighting.
  // NOTE: how do we get proper minimum and maximum readings so that 
  // all sensor readings can be normalized to a preset range?
  //minReading = sensorGreen.value;
  //maxReading = ...

  io.sockets.on('connection', function (socket){

    var check = setInterval(function(){

      // Log the state we're in
      console.log(state);

      // Get the sum of the intensities
      sum = state[0] + state[1] + state[2] + state[3];

      // How close are we to the goal
      relDistance = Math.abs( (goal - sum) / goal );
 
      // Episode index for keeping track of the past 10 episodes
      episodeIdx = learnTracker.nEpisodesPlayed % 10;

      var trialIdx = learnTracker.pastEpisodes.distanceMat.length

      // Add data to the learn tracker about the currently running episode
      learnTracker.pastEpisodes.distanceMat.push({
        "x" : trialIdx,
        "y" : relDistance
      });

      // If the distance is small enough, we can conlude the episode
      if ( relDistance < relDistanceTh ) {

        // How many actions were taken? 
        var nActionsTaken = learnTracker
	      .pastEpisodes
	      .distanceMat
	      .length

        // We conclude by first computing the reward of the episode
	var reward = getReward(nActionsTaken);

        // Send the reward to the qlearner
        qlearner.stdin.write('REWARD ' + reward + '\nNEW_EPISODE\n');

        // Reset the LEDs 
        resetLEDs();

        // Increment episode counter
        learnTracker.nEpisodesPlayed += 1;

        // Get the new episode index 
        episodeIdx = learnTracker.nEpisodesPlayed % 10;

        // Increment cumulative rewards
        learnTracker.cumulativeReward += reward;

        learnTracker.pastEpisodes.reward2episode.push({
          "x": learnTracker.nEpisodesPlayed - 1,
          "y": learnTracker.cumulativeReward / learnTracker.nEpisodesPlayed
        });

        // Send the learn tracker data to the browser
        socket.emit('info', learnTracker);

        // Erase the learn tracker data for the next episode index
        learnTracker.pastEpisodes.distanceMat = [];

      } else {

        // Otherwise we just send data to the browser
        var penguin = { distance   : relDistance, 
			state      : state, 
			rawState   : rawState, 
			ledVals    : [ leds[0].value, leds[1].value, leds[2].value, leds[3].value ],
			minReading : minReading, 
			maxReading : maxReading};

        // Pass penguin through the socket
        socket.emit('reading', penguin);

        // There needs to be enough characters to be written 
        // to stdin of the child process, 
        // otherwise no flushing occurs
        // NOTE: this is a hack and should be fixed
        qlearner.stdin.write('STATE ' + state[0] + ' ' + state[1] + ' ' + state[2] + ' ' + state[3] + '\n');

      }

    }, 1000.0 / args['updateFreq'] )

  });

  // Update state and raw state
  sensorGreen.on("data", function() {
    rawState[0] = this.value;
    state[0]    = scaledSensorReading(this.value);
  });

  sensorYellow.on("data", function() {
    rawState[1] = this.value;
    state[1]    = scaledSensorReading(this.value);
  });

  sensorRed.on("data", function() {
    rawState[2] = this.value;
    state[2]    = scaledSensorReading(this.value);
  });

  sensorBlue.on("data", function() {
    rawState[3] = this.value;
    state[3]    = scaledSensorReading(this.value);
  });

});
