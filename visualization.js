var socket = io.connect('http://localhost');
var histogramStartData = []

for (i=0; i<100; i++) {
  histogramStartData.push(Math.floor(Math.random()*100))
}

var LASTINFO;

var w = 1200;
var h = 300;
var distance_plot_w = w;
var distance_plot_h = h;
var margin = 30;
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

var svg3 = d3.select("#gain")
              .append("svg:svg")
              .attr("width", distance_plot_w)
              .attr("height", distance_plot_h)
              .append("svg:g");

var xAxis3 = d3.svg.axis()
                .scale(d3.scale.linear()) //identity scale to make it work
                .orient("bottom")
      
svg3.append("g")
    .attr("class","xAxis3")
    .call(xAxis3)

var yAxis3 = d3.svg.axis()
                .scale(d3.scale.linear())
                .orient("left")
svg3.append("g")
      .attr("class", "yAxis3")
      .call(yAxis3)



svg3.append("svg:path")
              .data([[{"x":0},{"y":0}]])
              .enter();


//setup density plot

//var svg4 = d3.select("#distance_plot")
//              .append("svg:svg")
//              .attr("width", distance_plot_w)
//              .attr("height", distance_plot_h)
//              .append("svg:g");

//var xAxis4 = d3.svg.axis()
//                .scale(d3.scale.linear()) //identity scale to make it work
//                .orient("bottom")
      
//svg4.append("g")
//    .attr("class","xAxis4")
//    .call(xAxis4)

//var yAxis4 = d3.svg.axis()
//                .scale(d3.scale.linear())
//                .orient("left")

//svg3.append("g")
//      .attr("class", "yAxis4")
//      .call(yAxis4)


$(document).ready(function(){

    socket.on('reading', function(penguin){
      $('#distance').text("Distance: " + penguin.distance);
      $('#green').text("Green: " + penguin.state[0])
      $('#yellow').text("Yellow: " + penguin.state[1])
      $('#red').text("Red: " + penguin.state[2])
      $('#blue').text("Blue: " + penguin.state[3])
    	var circlesToUpdate = svg.selectAll("circle")
            .data(penguin.state)
            .attr("cx", function(d, i) { return (i * 100) + 200; })
            .attr("cy", h/2)
            .attr("r", function(d) { return d*3; })
            .attr("fill", function(d, i) {
      		    return choosefill(i)
      	    });
    });

    socket.on('info', function(info){
      $("#nEpisodesPlayed")
          .text("Num. of episodes played: " + info.nEpisodesPlayed);
      $("#cumulativeReward")
          .text("Cumulative reward: " + info.cumulativeReward);
      LASTINFO = info;

      //svg3 gain
      var x3 = d3.scale.linear().domain([0, info.pastEpisodes.reward2episode.length]).range([20 + margin -5, w]);
      var y3 = d3.scale.linear().domain([0, 100.0]).range([h - margin, 0 + margin]);

      var xAxis3updater = d3.svg.axis()
                .scale(x3) 
                .orient("bottom")
      var yAxis3updater = d3.svg.axis()
                .scale(y3)
                .orient("left")
      svg3.selectAll("g.xAxis3")
          .call(xAxis3updater)
      svg3.selectAll("g.yAxis3")
          .attr("transform", "translate(30,0)")
          .call(yAxis3updater)

      var line = d3.svg.line()
              .x(function(d,i) { return x3(d.x); })
              .y(function(d,i) { return y3(d.y); })
      svg3.selectAll("path")
        .data([info.pastEpisodes.reward2episode])
        .attr("d", line)

      //svg4 distances over trials, lines are episodes
      //var x4 = d3.scale.linear().domain([0, 150]).range([0 + margin -5, w]);
      //var y4 = d3.scale.linear().domain([0, 1.0]).range([h - margin, 0 + margin]);




      //var xAxis4updater = d3.svg.axis()
      //          .scale(x4) 
      //          .orient("bottom")
      // var yAxis4updater = d3.svg.axis()
      //           .scale(y4)
      //           .orient("left")
      //svg4.selectAll("g.xAxis4")
      //    .call(xAxis4updater)
      // svg4.selectAll("g.yAxis4")
      //     .attr("transform", "translate(30,0)")
      //     .call(yAxis4updater)

      //var line4 = d3.svg.line()
      //        .x(function(d,i) { return x4(d.x); })
      //        .y(function(d,i) { return y4(d.y); });
      //svg4.append("svg:path")
      //      .data([info.pastEpisodes.distanceMat])
      //      .attr("d", line4);
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
