var express = require('express'),
app = express(),
server = require('http').createServer(app),
io = require('socket.io').listen(server),
port = 8080;

function Room(name){
    this.name = name;
    this.clients = new Object();
}

var clients = new Object();
var rooms = new Object();

server.listen(port);

app.use("/styles", express.static(__dirname + '/styles'));
app.use("/scripts", express.static(__dirname + '/scripts'));

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

    socket.emit('connect');
    socket.emit('userList', { clients: getClientList(clients) });

    socket.on('user', function (data) {
	console.log(data+" logged in");
	clients[socket.id] = data;
	io.sockets.emit('userList', { clients: getClientList(clients) });
    });

    socket.on('sendMessage', function (data) {
	var msg = clients[socket.id]+" : "+data.message;
	io.sockets.emit('message', { roomName: data.roomName, message: msg } );
    });

    socket.on('createRoom', function (data) {
	if( rooms[data] === undefined ){
	    createRoom(data);
	    rooms[data] = new Room(data);
	    rooms[data].clients[socket.id] = clients[socket.id];
	    io.sockets.emit('userListRoom', { roomname: data, clients: getClientList(rooms[key].clients) });
	    socket.emit('activeRoom', data);
	}
    });

    socket.on('selectRoom', function (data) {
	if( rooms[data] !== undefined ){
	    removeClient_Rooms(id);
	    rooms[data].clients[socket.id] = clients[socket.id];
	    socket.emit('activeRoom', data);
	}
    });

    socket.on('disconnect', function(){
	console.log(clients[socket.id]+" logged out");
	removeClient(socket.id);
    });

});

function removeClient(id){
    delete clients[id];
    removeClient_Rooms(id);
    io.sockets.emit('userList', { clients: getClientList(clients) });
}

function removeClient_Rooms(id){
    Object.keys(rooms).forEach(function (key) { 
	delete rooms[key].clients[id];
	io.sockets.emit('userListRoom', { roomname: key, clients: getClientList(rooms[key].clients) });
    })
}

function getClientList(list){
    var names = [];
    Object.keys(list).forEach(function (key) { 
	names.push(list[key]);
    })
    return names
}

function getRoomList(){
    var names = [];
    Object.keys(rooms).forEach(function (key) { 
	names.push(rooms[key].name);
    })
    return names
}
