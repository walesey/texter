var serverAddr = "127.0.0.1";
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

$('#makeRoom').click(function(){
    var roomName = $('#roomNameInput').val();
    socket.emit('createRoom', roomName);
});

function connect(){

    socket = io.connect( serverAddr );

    socket.on('connect', function(){
	socket.emit('user', userName );
    });

    socket.on('message', function(data){
	if(data.roomName == "public")
	    $("#messageArea").val( $("#messageArea").val() + "\n" + data.message );
	else if(data.roomName == activeRoom)
	    $("#messageArea_room").val( $("#messageArea_room").val() + "\n" + data.message );
	scroll();
    });
    
    socket.on('chatHistory', function(data){
	$("#messageArea_room").val("");
	for(var i=0;i<data.chatHistory.length;i++){
	    var chatLine = data.chatHistory[i];
	    var text = chatLine.userName + " : " + chatLine.message;
	    if(chatLine.room == "public")
		$("#messageArea").val( text + "\n" + $("#messageArea").val());
	    else if(chatLine.room == activeRoom)
		$("#messageArea_room").val( text + "\n" + $("#messageArea_room").val() );
	}
	scroll();
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

    socket.on('roomList', function(data){
	$("#roomList").html("");
	$("#roomList").height( data.rooms.length * 33 );
	for(var i=0;i<data.rooms.length;i++){
	    $("#roomList").html( "<div class=roombt>"+data.rooms[i]+"</div>" + $("#roomList").html() );
	    $(".roombt").click(function(){
		joinRoom($(this).html());
	    });
	}
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
    $("#inputText").val("");
    socket.emit('sendMessage', { roomName: "public", message: msg });
}

function sendMessageRoom(){
    var msg = $("#inputText_room").val();    
    $("#inputText_room").val("");
    socket.emit('sendMessage', { roomName: activeRoom, message: msg });
}

function joinRoom(name){
    socket.emit('selectRoom', name);
}

//make text areas scroll to bottom
function scroll(){
    var textarea1 = document.getElementById('messageArea');
    textarea1.scrollTop = textarea1.scrollHeight;
    var textarea2 = document.getElementById('messageArea_room');
    textarea2.scrollTop = textarea2.scrollHeight;
}
