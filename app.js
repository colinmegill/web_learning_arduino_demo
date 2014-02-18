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

var socket;

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

// Spawn the learner with the following input arguments
// NOTE: -u is supposed to treat streams unbuffered
var qlearner = spawn('python2.7', [
    'qlearner.py',
    '--actions'         ,'0,1','0,-1','1,1','1,-1','2,1','2,-1','3,1','3,-1',
    '--nStateDims'      ,'5',
    '--epsilon'         ,'0.1',
    '--epsilonDecayRate','0.00001',
    '--learnRate'       ,'0.1',
    '--discountRate'    ,'0.1',
    '--replayMemorySize','1000',
    '--miniBatchSize'   ,'10']) 

var learnTracker = {
    nEpisodesPlayed : 0,
    totalActionsTaken : 0,
    cumulativeReward: 0,
    pastEpisodes : {
      reward2episode : [],
    }
};

// Store state of the system.
// Here, state is the vector of light intensities
// with some discretization and bucketization
var state    = [0,0,0,0,0];

// The raw state is same as the state, but no
// discretization or bucketization has been added
var rawState = [0,0,0,0,0];

// What is the goal, which is the 
// sum of the intensities of the photo sensors
var goal = 2;

// And how far are we from the goal
var relDistance = 1.0;

// How close we should get in order to get reward?
var relDistanceTh = 0.05;

// Jow much brightness is added/removed per action
var deltas = [30,30,30,30];

// We will store the minimum and maximum readings of the photo sensors
// so that our scaling eliminates the ambient lighting.
var minReading = 0;
var maxReading = minReading + 200;

var reward = 0.0;

// This one turns on every time the learner tries to set LED values
// beyond limits
var ledBoundaryExceeded = false;

var scaledSensorReading = function(x) {

  var val = ( x - minReading ) / (maxReading - minReading);

  val = val < 0 ? 0 : val;
  val = val > 1 ? 1 : val;
    
  return val;

};

var processDeltaAction = function(actionStr) {

    // Which LED are we going to touch?
    var pinID  = parseInt(actionStr.split(',')[0]);

    // Are we increasing or decreasing the brightness?
    var sign = parseInt(actionStr.split(',')[1]);

    // What is the new brightness value?
    var newBrightness = leds[pinID].value + sign * deltas[pinID];

    if ( newBrightness < 0 || newBrightness > 255 ) {
	ledBoundaryExceeded = true;
    }

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
  
  for ( var i = 0; i < lines.length - 1; ++i ) {
    
    var line = lines[i];
      
    var obj = JSON.parse(line)

    // leds will be modified
    processDeltaAction(obj["action"]);

    setTimeout(processStatus, 1000 / args['updateFreq'] );

  }

  console.log(lines + '\n');

}); 

// Which port to listen
server.listen(args['port']);
app.use(express.static(__dirname));

// Establish a connection to the board
board = new five.Board({
  port: args['device']
});

var processStatus = function() {

    // Log the state we're in
    console.log(state);
    
    // Get the sum of the intensities
    sum = state[0] + state[1] + state[2] + state[3];
    
    // How close are we to the goal
    var newRelDistance = Math.abs( (goal - sum) / goal );
    
    var reward;

    if ( ledBoundaryExceeded || relDistance <= newRelDistance ) {
      reward = - 1;
      ledBoundaryExceeded = false;
    } else if ( relDistance < relDistanceTh || relDistance > newRelDistance ) {
      reward = 1;
      learnTracker.cumulativeReward += reward;
    }
    
    relDistance = newRelDistance;
    
    nActionsTaken += 1;
    
    learnTracker.totalActionsTaken += 1;
    
    if ( nActionsTaken >= 100 || relDistance < relDistanceTh ) {
	
	var isTerminal;
	
        // We conclude by first computing the reward of the episode
	if ( relDistance < relDistanceTh ) {
            isTerminal = 1;
	} else {
	    isTerminal = 0;
        }
	
	// Increment episode counter
        learnTracker.nEpisodesPlayed += 1;
	
	// Reset LEDs
	resetLEDs();
	
	learnTracker.pastEpisodes.reward2episode.push({
	    "x": learnTracker.nEpisodesPlayed - 1,
	    "y": learnTracker.cumulativeReward / learnTracker.totalActionsTaken
        });
	
	nActionsTaken = 0;
	
	// Send the learn tracker data to the browser
	info = learnTracker;
        socket.emit('info', learnTracker);
 	
	// Send the reward to the qlearner
        qlearner.stdin.write(JSON.stringify({'state':state,
					     'reward':reward,
					     'isTerminal':isTerminal})  
			     + '\n');
	
    } else {
	
        // Otherwise we just send data to the browser
        var penguin = { distance   : relDistance, 
			state      : [ 10 * state[0],
				       10 * state[1],
				       10 * state[2],
				       10 * state[3] ],
			ledVals    : [ leds[0].value,
				       leds[1].value,
				       leds[2].value,
				       leds[3].value ],
			rawState   : rawState, 
			minReading : minReading, 
			maxReading : maxReading};
	
        // Pass penguin through the socket
        socket.emit('reading', penguin);
	
	// Pass the current state to the qlearner app
        qlearner.stdin.write(JSON.stringify({'state':state,
					     'reward':reward,
					     'isTerminal':0}) + '\n');
	
    }
};
    

// When the board is ready, fire up this callback function
board.on("ready", function() {

  // Indicate where the sensors sit on the board
  sensorGreen  = new five.Sensor({pin: "A0"});
  sensorYellow = new five.Sensor({pin: "A1"});
  sensorRed    = new five.Sensor({pin: "A2"});
  sensorBlue   = new five.Sensor({pin: "A3"});
  sensorEnv    = new five.Sensor({pin: "A4"});

  // Collect the sensors into an array
  sensors = [sensorGreen, sensorYellow, sensorRed, sensorBlue, sensorEnv ]

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

  nActionsTaken = 0;

  io.sockets.on('connection', function(newSocket) {

    socket = newSocket;

    setTimeout(processStatus, 1000 / args['updateFreq'] );

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

  sensorEnv.on("data", function() {
    minReading  = this.value;
    maxReading  = minReading + 300;
    rawState[4] = this.value;
    state[4]    = this.value / 300;
  });

});
