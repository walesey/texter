var serverAddr = "10.1.1.4";
var socket;
var userName = prompt("Please enter a nickname", "Bogan");

connect();

$('#inputText').bind('keypress', function(e) {
    if(e.keyCode==13){
	sendMessage();
    }
});


function connect(){

    socket = io.connect( serverAddr );

    socket.on('connect', function(){
	socket.emit('user', userName );
    });

    socket.on('message', function(data){
	console.log("test");
	$("#messageArea").val( data + "\n" + $("#messageArea").val());
    });

    socket.on('userList', function(data){
	$("#usersArea").val("");
	for(var i=0;i<data.clients.length;i++)
	    $("#usersArea").val( $("#usersArea").val()+"\n"+data.clients[i] );
    });
}


function sendMessage(){
    socket.emit('sendMessage', $("#inputText").val());
}
