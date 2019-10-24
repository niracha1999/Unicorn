//Make connection
var socket = io.connect();
var roomID = "serverRoom";
var theConsole = document.getElementById("console");
var btn = document.getElementById("resetbtn");
joinRoom();

socket.on('numPlayerInRoom', function(data){
    console.log('adasdadadad');
    theConsole.innerHTML +=  "&#13;&#10;"+data.a;
    theConsole.innerHTML += "&#13;&#10;"+data.b;
});
socket.on('playerDisconnected', function(data){
    theConsole.innerHTML += "&#13;&#10;"+data;
});
socket.on('canStart', function(data){
    theConsole.innerHTML += "&#13;&#10;"+'The game has started by '+ data.startPlayer;
});
socket.on('whoWinsforServer', function(data){
    console.log('Hey shit');
    theConsole.innerHTML += "&#13;&#10;"+data;
    // theConsole.innterHTML += "&#13;&#10;"+data;
});
socket.on('announcement', function(data){
    theConsole.innerHTML += "&#13;&#10;"+data;
});
socket.on('playerAName', function(data){
    theConsole.innerHTML += "&#13;&#10;"+data.aName+" is A.";
});
socket.on('playerBName', function(data){
    theConsole.innerHTML += "&#13;&#10;"+data.bName+" is B.";
});

btn.addEventListener("click", function(){
    socket.emit('reset', "server");
    window.location.replace(window.location.href);
});

function joinRoom(){
    socket.emit("joinRoom", roomID);
}
joinRoom();



