##Seed node.js project connecting arbitrary sensors to a servo

###Up & Running

		$ git clone https://github.com/colinmegill/web_learning_arduino_demo.git
		$ npm install express socket.io johnny-five node-getopt
		$ nosetests
		$ node app.js


###Servo API

min()
	set the servo to the minimum degrees
	defaults to 0
	eg. servo.min();

max()
	set the servo to the maximum degrees
	defaults to 180
	eg. servo.max();

center()
	centers the servo to 90°

move( deg )
	Moves the servo to position by degrees
	servo.to( 90 );

sweep( obj )
	Perform a min-max cycling servo sweep (defaults to 0-180)
	optionally accepts an object of sweep settings:
	{
	   lapse: time in milliseconds to wait between moves
	          defaults to 500ms
	   degrees: distance in degrees to move
	          defaults to 10°
	}
	servo.sweep();