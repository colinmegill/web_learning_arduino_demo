var socket = io.connect('http://localhost');
var histogramStartData = []

for (i=0; i<100; i++) {
  histogramStartData.push(Math.floor(Math.random()*100))
}

var w = 600;
var h = 300;
var distance_plot_w = w;
var distance_plot_h = h * 2;


var barpadding = 1;

/* led circles setup */

var svg = d3.select("#viz")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

var circles = svg.selectAll("circle")
    .data([1, 1, 1, 1])
    .enter()
    .append("circle");

$(document).ready(function(){

    socket.on('reading', function(penguin){
	$('#distance').text("Distance: " + penguin.distance);
	$('#green').text("Green: " + penguin.state[0])
	$('#yellow').text("Yellow: " + penguin.state[1])
	$('#red').text("Red: " + penguin.state[2])
	$('#blue').text("Blue: " + penguin.state[3])
	
	var circlesToUpdate = svg.selectAll("circle")
    	    .data(penguin.state)
	
	circlesToUpdate.attr("cx", function(d, i) { return (i * 50) + 25; })
      	    .attr("cy", h/2)
      	    .attr("r", function(d) { return d; })
      	    .attr("fill", function(d, i) {
      		return choosefill(i)
      	    });

	// textToUpdate = svg.selectAll("text")
	// 										.data(penguin.state)
	
	// textToUpdate.attr("cx", function(d, i) { return () })
    });

    socket.on('info', function(info){
	$("#nEpisodesPlayed").text("Num. of episodes played: " + info.nEpisodesPlayed);
	$("#cumulativeReward").text("Cumulative reward: " + info.cumulativeReward);
	$("#nStatesExplored").text("Num. of states explored: " + info.nStatesExplored);

    });
});

/* histogram setup */ 

var svg2 = d3.select("#histogram")
              .append("svg")
              .attr("width", w)
              .attr("height", h)

var histogram = svg2.selectAll("rect")
                    .data(histogramStartData)
                    .enter()
                    .append("rect")
                    .attr("x", function(d, i){
                      return i * (w / histogramStartData.length);
                    })
                    .attr("y", function(d, i){
                      return 0;
                    })
                    .attr("width", function(d, i){
                      return w / histogramStartData.length - barpadding;
                    })
                    .attr("height", function(d){
                      return d;
                    })


/* distance plot setup */ 

var distanceStartData = [];

for (i=0; i < 100; i++) {
  distanceStartData.push({x: Math.floor(Math.random() * 100), y: Math.random()})
}

var margin = 30;
var x = d3.scale.linear().domain([0, 100]).range([0 + margin -5, w]);
var y = d3.scale.linear().domain([0, 1.0]).range([0 + margin, h - margin]);

var svg3 = d3.select("#distance_plot")
              .append("svg:svg")
              .attr("width", distance_plot_w)
              .attr("height", distance_plot_h)
              .append("svg:g")

var line = d3.svg.line()
              .x(function(d,i) { return x(d.x); })
              .y(function(d,i) { return y(d.y); })

svg3.append("svg:path")
    .data([distanceStartData])
    .attr("d", line)


function choosefill(index) {
	if(index === 0) { return "#27ae60" }
	if(index === 1) { return "#f1c40f"}
	if(index === 2) { return "#c0392b"}
	if(index === 3) { return "#2980b9"}
}
