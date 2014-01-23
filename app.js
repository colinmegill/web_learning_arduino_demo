var five = require("johnny-five");
var board;
var servo;

var util = require('util');
var spawn = require('child_process').spawn;
var qlearner = spawn('python', ['qlearner.py']); 


qlearner.stdout.pipe(process.stdout, { end: false });
process.stdin.resume();
process.stdin.pipe(qlearner.stdin, { end: false });

qlearner.stdin.on('end', function(){
  process.stdout.write('qlearner stream ended.');
});

qlearner.on('exit', function(code){
  process.exit(code);
});


// qlearner.stdin.write('STATE 0 0 0 0 1.0\n');
// qlearner.stdin.end();

// qlearner.stdout.on('data', function (data) { 
//   util.print(data)
// }); 

qlearner.stderr.on('data', function (data) {
  console.log('python stderr: ' + data)
})

/*

node will capture from the child process
1. action to increment LED: DELTA_ACTION
2. reset LEDs to 0: RESET_ACTION

could send snapshot of state of board, wait for action

normalize photoresistor

DISTANCE

node: increment blue
board: blue increments
board: photoresistor checks value
node: receives photoresistor value
node: sends data to python
python: calculates the next action to take - could be delta or reset, if delta, 0 1 2 3 and + or - 
node: recieves action which could be reset or delta - resets state 



node has to know about
1. intensity of LED
2. state of board


*/




// board = new five.Board();

// board.on("ready", function() {

//   var range = [2, 158]

//   servo = new five.Servo({pin:10, range: range});
//   photoresistor = new five.Sensor({pin: "A0"})

//   board.repl.inject({
//     photoresistor: photoresistor,
//     servo: servo
//   });

//   servo.center();

//   photoresistor.scale(range).on("data", function() {
//     console.log( "Normalized value: " + this.normalized + "  Scaled Value: " + this.scaled );
//     servo.to(Math.floor(this.scaled));
//   });
// });