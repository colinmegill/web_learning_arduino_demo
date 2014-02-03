
//d3 linegraph

	w = 925,
	h = 550,
	margin = 30,
	startYear = 1960, 
	endYear = 2010,
	startAge = 20,
	endAge = 80,
	
	y = d3.scale.linear().domain([endAge, startAge]).range([0 + margin, h - margin]),
	x = d3.scale.linear().domain([1960, 2009]).range([0 + margin -5, w]),
	years = d3.range(startYear, endYear);


var vis = d3.select("#vis")
    .append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .append("svg:g")

			
var line = d3.svg.line()
    .x(function(d,i) { return x(d.x); })
    .y(function(d) { return y(d.y); });




vis.append("svg:path")
    .data({})
    .attr("d", line)





var linegraphdata = {
 
  run1distances: [
    .8,
    .7,
    .6,
    .2,
    .1,
    0
  ],
 
  run2distances: [
    ...etc...
  ]
}






// STDIN / STDOUT
var util = require('util');
var spawn = require('child_process').spawn;


var qlearner = spawn('python', ['qlearner.py']); 

qlearner.stdin.on('end', function(){
  process.stdout.write('qlearner stream ended.');
});

qlearner.on('exit', function(code){
  process.exit(code);
});

qlearner.stdout.on('data', function (data) { 
  util.print(data)
}); 

qlearner.stderr.on('data', function (data) {
  console.log('python stderr: ' + data)
})



// qlearner.stdin.write('STAATE 0 0 0 0 1.0\n');
// qlearner.stdin.end();


/*

node will capture from the child process
1. action to increment LED: DELTA_ACTION
2. reset LEDs to 0: RESET_ACTION

could send snapshot of state of board, wait for action

normalize photoresistor

node has a concept of DISTANCE

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


// PYTHON
// def dummy(): 
// 	for i in range(0,10):
// 		sys.stdout.write("dummy process " + str(i+1) + "/10\n")
// 		sys.stdout.flush()
// 		time.sleep(0.2) 

// 	for line in sys.stdin:
// 		sys.stdout.write(line.rstrip() + ' BOOM\n')
// 		sys.stdout.flush()






// do we learn, how do we learn...
