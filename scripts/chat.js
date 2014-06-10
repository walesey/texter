var serverAddr = "10.1.1.4";
var socket;
var userName = prompt("Please enter a nickname", "Bogan");
var activeRoom = "";

connect();

$('#inputText').bind('keypress', function(e) {
    if(e.keyCode==13){
	sendMessage();
    }
});

$('#inputText_room').bind('keypress', function(e) {
    if(e.keyCode==13){
	sendMessageRoom();
    }
});


function connect(){

    socket = io.connect( serverAddr );

    socket.on('connect', function(){
	socket.emit('user', userName );
    });

    socket.on('message', function(data){
	if(data.roomName == "public")
	    $("#messageArea").val( data.message + "\n" + $("#messageArea").val());
	else
	    $("#messageArea_room").val( data.message + "\n" + $("#messageArea").val());
    });

    socket.on('userList', function(data){
	$("#usersArea").val("");
	for(var i=0;i<data.clients.length;i++)
	    $("#usersArea").val( $("#usersArea").val()+"\n"+data.clients[i] );
    });
    
    socket.on('userListRoom', function(data){
	$("#usersArea_room").val("");
	for(var i=0;i<data.clients.length;i++)
	    $("#usersArea_room").val( $("#usersArea_room").val()+"\n"+data.clients[i] );
    });

    socket.on('activeRoom', function(data){
	setRoomName(data);
    });
}

function setRoomName(name){
    activeRoom = name;
    $("#roomName").text(name);
}

function sendMessage(){
    var msg = $("#inputText").val();
    socket.emit('sendMessage', { roomName: "public", message: msg });
}

function sendMessageRoom(){
    var msg = $("#inputText_room").val();
    socket.emit('sendMessage', { roomName: activeRoom, message: msg });
}
