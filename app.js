var express = require('express');
var io = require('socket.io');
var app = express();
var server = require('http').createServer(app);
var io = io.listen(server);
var five = require("johnny-five");
var board;
var servo;
var util = require('util');
var spawn = require('child_process').spawn;

// Spawn the learner with the following input arguments
var qlearner = spawn('python', [
    'qlearner.py',
    '--nStateDims'      ,'4',
    '--relDistanceTh'   ,'0.05',
    '--learnRate'       ,'0.5',
    '--discountRate'    ,'0.1',
    '--replayMemorySize','100']) 

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

// Jow much brightness is added/removed per action
var deltas = [3,3,3,3]

// We will store the minimum and maximum readings of the photo sensors
// so that our scaling eliminates the ambient lighting.
var minReading = 20;
var maxReading = 50;

// How many buckets per scaled reading? 
var minBucket = 0;
var maxBucket = 9;

var scaledSensorReading = function(x) {

  var val = Math.floor( (maxBucket - minBucket) * ( x - minReading ) / ( maxReading - minReading ) + minBucket );

  val = val < minBucket ? minBucket : val;
  val = val > maxBucket ? maxBucket : val;
    
  return val;

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
  var str = buffer.toString('utf8').replace(/\n/g,'');

  // Action is the first element in the field
  var action = str.split(' ')[0];

  if ( action === 'DELTA_ACTION' ) {

    // Which LED are we going to touch?
    var pinID  = parseInt(str.split(' ')[1]);

    // Are we increasing or decreasing the brightness?
    var sign   = parseInt(str.split(' ')[2]);

    // What is the new brightness value?
    var newBrightness = leds[pinID].value + sign * deltas[pinID];

    // Assign the LED new brightness value 
    leds[pinID].brightness( newBrightness );

  } else if ( action === 'RESET_ACTION' ) {

    // If reset action is sent, we'll turn all
    // LEDs off.
    leds[0].brightness(0);
    leds[1].brightness(0);
    leds[2].brightness(0);
    leds[3].brightness(0);

  }

  console.log(buffer.toString('utf8'));

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


  sensorGreen  = new five.Sensor({pin: "A0"});
  sensorYellow = new five.Sensor({pin: "A1"});
  sensorRed    = new five.Sensor({pin: "A2"});
  sensorBlue   = new five.Sensor({pin: "A3"});

  sensors = [sensorGreen, sensorYellow, sensorRed, sensorBlue ]

  ledGreen  = new five.Led({ pin: 11 })
  ledYellow = new five.Led({ pin: 10 })
  ledRed    = new five.Led({ pin: 6  })
  ledBlue   = new five.Led({ pin: 5  })

  leds = [ledGreen,ledYellow,ledRed,ledBlue];

  board.repl.inject({
    green:   ledGreen,
    yellow:  ledYellow,
    red:     ledRed,
    blue:    ledBlue,
    leds:    leds,
    sensors: sensors
  });

  ledGreen.brightness(0);
  ledYellow.brightness(0);
  ledRed.brightness(0);
  ledBlue.brightness(0);

  // We will get the minimum intensity reading now that all LEDs are off.
  // This minimum intensity corresponds to the surrounding lighting.
  // NOTE: how do we get proper minimum and maximum readings so that 
  // all sensor readings can be normalized to a preset range?
  //minReading = sensorGreen.value;
  //maxReading = ...

  io.sockets.on('connection', function (socket){
    var check = setInterval(function(){

      console.log(state);

      sum = state[0] + state[1] + state[2] + state[3];

      relDistance = Math.abs((goal - sum)/goal);

      // A penguin object we pass to the browser
      var penguin = { distance: relDistance, 
		      state: state, 
		      rawState : rawState, 
		      minReading : minReading, 
		      maxReading : maxReading};

      // Pass penguin through the socket
      socket.emit('reading', penguin);

      // There needs to be enough characters to be written to stdin of the child process, 
      // otherwise no flushing occurs
      // NOTE: this is a hack and should be fixed
      qlearner.stdin.write('STAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATE ' + state[0] + ' ' + state[1] + ' ' + state[2] + ' ' + state[3] + ' ' + relDistance + '\n');

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
