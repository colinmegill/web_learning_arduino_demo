var express = require('express');
var io = require('socket.io');
var app = express()
  , server = require('http').createServer(app)
  , io = io.listen(server);
var five = require("johnny-five"),
    board, lcd;

server.listen(8080);

app.use(express.static(__dirname));

// app.get('/', function(req, res){
// 	res.sendfile(__dirname + '/index.html')
// })

/* begin robot */

board = new five.Board();

board.on("ready", function() {

  lcd = new five.LCD({
    // LCD pin name  RS  EN  DB4 DB5 DB6 DB7
    // Arduino pin # 7    8   9   10  11  12
    pins: [ 7, 8, 9, 10, 11, 12 ],
  });

  lcd.on("ready", function() {
    io.sockets.on('connection', function (socket){
  		socket.on('typing', function (data) {
  		  lcd.clear().print(data.toString());
  		  console.log(data)
  		});    	
    })
  });

  this.repl.inject({
    lcd: lcd
  });

});