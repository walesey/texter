var express = require('express'),
app = express(),
server = require('http').createServer(app),
io = require('socket.io').listen(server),
port = 8080;

var clients = new Object();

server.listen(port);

app.use("/styles", express.static(__dirname + '/styles'));
app.use("/scripts", express.static(__dirname + '/scripts'));

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

    socket.emit('connect');
    socket.emit('userList', { clients: getClientList() });

    socket.on('user', function (data) {
	console.log(data+" logged in");
	clients[socket.id] = data;
	io.sockets.emit('userList', { clients: getClientList() });
    });

    socket.on('sendMessage', function (data) {
	io.sockets.emit('message', clients[socket.id]+" : "+data);
    });

    socket.on('disconnect', function(){
	console.log(clients[socket.id]+" logged out");
	delete clients[socket.id];
	io.sockets.emit('userList', { clients: getClientList() });
    });

});

function getClientList(io){
    var names = [];
    Object.keys(clients).forEach(function (key) { 
	names.push(clients[key]);
    })
    return names
}
