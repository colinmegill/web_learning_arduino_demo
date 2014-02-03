var socket = io.connect('http://localhost');
var w = 500;
var h = 50;
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

})

// var rect = svg.selectAll("rect")			

function choosefill(index) {
	if(index === 0) { return "#27ae60" }
	if(index === 1) { return "#f1c40f"}
	if(index === 2) { return "#c0392b"}
	if(index === 3) { return "#2980b9"}
}
