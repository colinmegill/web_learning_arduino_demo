var socket = io.connect('http://localhost');
var histogramStartData = []

for (i=0; i<100; i++) {
  histogramStartData.push(Math.floor(Math.random()*100))
}

var LASTINFO;

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

//setup GAIN linegraph

var margin = 30;
var svg3 = d3.select("#gain")
              .append("svg:svg")
              .attr("width", distance_plot_w)
              .attr("height", distance_plot_h)
              .append("svg:g");

svg3.append("svg:path")
              .data([[{"x":0},{"y":0}]])
              .enter();

var svg4 = d3.select("#distance_plot")
              .append("svg:svg")
              .attr("width", distance_plot_w)
              .attr("height", distance_plot_h)
              .append("svg:g");

$(document).ready(function(){

    socket.on('reading', function(penguin){
      $('#distance').text("Distance: " + penguin.distance);
      $('#green').text("Green: " + penguin.state[0])
      $('#yellow').text("Yellow: " + penguin.state[1])
      $('#red').text("Red: " + penguin.state[2])
      $('#blue').text("Blue: " + penguin.state[3])
    	var circlesToUpdate = svg.selectAll("circle")
            .data(penguin.state)
            .attr("cx", function(d, i) { return (i * 50) + 25; })
            .attr("cy", h/2)
            .attr("r", function(d) { return d; })
            .attr("fill", function(d, i) {
      		    return choosefill(i)
      	    });
    });

    socket.on('info', function(info){
      $("#nEpisodesPlayed")
          .text("Num. of episodes played: " + info.nEpisodesPlayed);
      $("#cumulativeReward")
          .text("Cumulative reward: " + info.cumulativeReward);
      $("#nStatesExplored")
          .text("Num. of states explored: " + info.nStatesExplored);
      LASTINFO = info;

      //svg3 gain
      var x3 = d3.scale.linear().domain([0, info.pastEpisodes.reward2episode.length]).range([0 + margin -5, w]);
      var y3 = d3.scale.linear().domain([0, 1.0]).range([0 + margin, h - margin]);
      var line = d3.svg.line()
              .x(function(d,i) { return x3(d.x); })
              .y(function(d,i) { return y3(d.y); })
      svg3.selectAll("path")
        .data([info.pastEpisodes.reward2episode])
        .attr("d", line)

      //svg4 distances over trials, lines are episodes
      var x4 = d3.scale.linear().domain([0, 100]).range([0 + margin -5, w]);
      var y4 = d3.scale.linear().domain([0, 1.0]).range([0 + margin, h - margin]);
      var line4 = d3.svg.line()
              .x(function(d,i) { return x4(d.x); })
              .y(function(d,i) { return y4(d.y); });
      svg4.append("svg:path")
            .data([info.pastEpisodes.distanceMat])
            .attr("d", line4);
    });
});

// /* histogram setup */ 

// var svg2 = d3.select("#histogram")
//               .append("svg")
//               .attr("width", w)
//               .attr("height", h)

// var histogram = svg2.selectAll("rect")
//                     .data(histogramStartData)
//                     .enter()
//                     .append("rect")
//                     .attr("x", function(d, i){
//                       return i * (w / histogramStartData.length);
//                     })
//                     .attr("y", function(d, i){
//                       return 0;
//                     })
//                     .attr("width", function(d, i){
//                       return w / histogramStartData.length - barpadding;
//                     })
//                     .attr("height", function(d){
//                       return d;
//                     })




function choosefill(index) {
	if(index === 0) { return "#27ae60" }
	if(index === 1) { return "#f1c40f"}
	if(index === 2) { return "#c0392b"}
	if(index === 3) { return "#2980b9"}
}
