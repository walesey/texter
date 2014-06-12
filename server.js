var express = require('express'),
app = express(),
server = require('http').createServer(app),
io = require('socket.io').listen(server),
port = 8080;
//database
var mysql = require("mysql");
var database = new mysql.createConnection({
    "hostname": "localhost",
    "user": "joshua",
    "password": "Flipaflop!"
});
startDatabase();

//show last 50 messages to new users entering a room.
var MSG_LENGTH = 50;

function Client(name, socket){
    this.name = name;
    this.socket = socket;
}

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
	clients[socket.id] = new Client(data, socket);
	io.sockets.emit('userList', { clients: getClientList(clients) });
	socket.emit('roomList', { rooms: getRoomList() });
	db_sendMessages("public", socket);
    });

    socket.on('sendMessage', function (data) {
	var msg = clients[socket.id].name+" : "+data.message;
	db_addMessage(data.message, clients[socket.id].name, data.roomName);
	if(data.roomName == "public")
	    io.sockets.emit('message', { roomName: data.roomName, message: msg });
	else
	    sendMessage( data.roomName, msg);
    });

    socket.on('createRoom', function (data) {
	if( rooms[data] === undefined ){
	    removeClient_Rooms(socket.id);
	    rooms[data] = new Room(data);
	    rooms[data].clients[socket.id] = clients[socket.id];
	    sendRoomUserList(data);
	    socket.emit('activeRoom', data);
	    io.sockets.emit('roomList', { rooms: getRoomList() });
	    db_sendMessages(data, socket);
	}
    });

    socket.on('selectRoom', function (data) {
	if( rooms[data] !== undefined && rooms[data].clients[socket.id] === undefined ){
	    removeClient_Rooms(socket.id);
	    rooms[data].clients[socket.id] = clients[socket.id];
	    socket.emit('activeRoom', data);
	    socket.emit('userListRoom', { roomname: data, clients: getClientList(rooms[data].clients) });
	    db_sendMessages(data, socket);
	    sendRoomUserList(data);
	}
    });

    socket.on('disconnect', function(){
	if( clients[socket.id] !== undefined ){
	    console.log(clients[socket.id].name+" logged out");
	    removeClient(socket.id);
	}
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
	if( getClientList(rooms[key].clients) == 0 )
	    removeRoom(key);
	sendRoomUserList(key);
    })
}

function removeRoom(name){
   delete rooms[name];
    io.sockets.emit('roomList', { rooms: getRoomList() });
}

function getClientList(list){
    var names = [];
    Object.keys(list).forEach(function (key) { 
	names.push(list[key].name);
    })
    return names;
}

function getRoomList(){
    var names = [];
    Object.keys(rooms).forEach(function (key) { 
	names.push(rooms[key].name);
    })
    return names;
}

function sendMessage( room, msg ){
    if( rooms[room] !== undefined ){
	var list = rooms[room].clients;
	Object.keys(list).forEach(function (key) {
	    var socket = list[key].socket;
	    socket.emit('message', {roomName: room, message: msg });
	})
    }
}

function sendRoomUserList(room){
    if( rooms[room] !== undefined ){
	var list = rooms[room].clients;
	Object.keys(list).forEach(function (key) {
	    var socket = list[key].socket;
	    socket.emit('userListRoom', { roomname: room, clients: getClientList(rooms[room].clients) });
	})
    }
}

function startDatabase(){

    database.connect();

    database.query("CREATE DATABASE IF NOT EXISTS texterDB");
    database.query("USE texterDB");

    database.query("CREATE TABLE IF NOT EXISTS messages ( id bigint unique auto_increment primary key, userName varchar(255), " +
		   "message varchar(4096), room varchar(255) )");
}

function db_addMessage(message, userName, roomName){
    database.query( "insert into messages(userName, message, room) values ('"+userName+"', '"+message+"', '"+roomName+"');");
}

function db_sendMessages(roomName, socket){
    database.query( "select * from messages where room='"+roomName+"' order by id desc", function(err, rows){
	if(err){
	    throw err;
	}
	var result = [];
	for(var i=0;(i<MSG_LENGTH) && i<rows.length; i++)
	    result.push( rows[i] );
	socket.emit('chatHistory', { room: roomName, chatHistory: result });
    });
}
