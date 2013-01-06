
var app = require('express').createServer()
var io = require('socket.io').listen(app);

app.listen(8080);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};
var messages = [];
var messageLenMax = 40;
var colors = [ 'green', 'orange', 'purple', 'red', 'blue'];
colors.sort(function() {
	var random = Math.random();
	return random > 0.5;
});
io.sockets.on('connection', function (socket) {
	for (var i = 0; i < messages.length; i++) 
		socket.emit('message', messages[i]);
	function pushBackMessage(username, userColor, message) {
		messages[messages.length] = {username: username, userColor: userColor, message: message};
		if (messages.length > messageLenMax) 
			messages.splice(0, 1);
	}
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('updatechat', socket.username, socket.userColor, data);
		pushBackMessage(socket.username, socket.userColor, data);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		// sets the user's color
		socket.userColor = colors.shift();
		// echo to client they've connected
		socket.emit('initial', 'SERVER',  'you have connected.');
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('initial', 'SERVER', socket.username + ' has connected.');
		// update the list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		colors.push(socket.userColor);
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('initial', 'SERVER', socket.username + ' has disconnected.');
	});
});