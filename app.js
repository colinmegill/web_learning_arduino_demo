var five = require("johnny-five");
var board;
var servo;

board = new five.Board();

board.on("ready", function() {

  var range = [2, 158]

  servo = new five.Servo({pin:10, range: range});
  photoresistor = new five.Sensor({pin: "A0"})

  board.repl.inject({
    photoresistor: photoresistor,
    servo: servo
  });

  servo.center();

  photoresistor.scale(range).on("data", function() {
    console.log( "Normalized value: " + this.normalized + "  Scaled Value: " + this.scaled );
    servo.to(Math.floor(this.scaled));
  });
});