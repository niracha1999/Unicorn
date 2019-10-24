
//Make connecttion
var socket = io.connect();
var roomID = "Game Room";
var player;

function joinRoom(){
    socket.emit("joinRoom", roomID);
}
joinRoom();

var size = 6;
var Field=[];
var playerA = true;
var scoreA =0;
var scoreB =0;
var timeout = 10000;
var row =[];
var score;
var winner;
var timer;
var name;
var p1Name;
var p2Name;

playerA = true;
document.getElementById("popup").style.visibility="hidden";
document.getElementById("overlay").style.visibility="hidden";
name = prompt("Enter Your Name");


socket.on('player-number', function(data){
    if(data == 0){
        player = "B";
        socket.emit('playerBName', name);
        alert("you are "+name);
    } else if (data == 1){
        player = "A";
        socket.emit('playerAName', name);
        alert("you are "+name);
    } else {
        alert("The room is full");
    }
});

socket.on('playerAName', function(data){
    document.getElementById("playerA").innerHTML = data.p1Name;
    document.getElementById("playerB").innerHTML = data.p2Name;
    p1Name = data.p1Name;
    p2Name = data.p2Name;
});

socket.on('playerBName', function(data){
    document.getElementById("playerA").innerHTML = data.p1Name;
    document.getElementById("playerB").innerHTML = data.p2Name;
    p1Name = data.p1Name;
    p2Name = data.p2Name;
});


socket.on('canStart', function(data){
    if(data.startPlayer == "B"){
        playerA=false;
        document.getElementById("turnA").innerHTML = "WAITING";
        document.getElementById("turnB").innerHTML = data.p2Name + "YOUR TURB";
    }else{
        playerA=true;
        document.getElementById("turnA").innerHTML = data.p1Name + "YOUR TURN";
        document.getElementById("turnB").innerHTML = "WAITING";
    }
    if(data.cs == true){
        Field = data.field;
        document.getElementById("timer").innerHTML = "10";

        timer = new Timer(function() {   
            timeout = timeout - 1000;
            var seconds = Math.floor((timeout % (1000 * 60)) / 1000);
            document.getElementById("timer").innerHTML = seconds;
        
            if (timeout < 1) {
                timer.reset(1000);
            }
        }, 1000);
        
        document.getElementById("start").onclick = null;

    }
});

var soundBomb=new Audio("music/bomb.mp3");
var soundNotBomb=new Audio("music/notbomb.mp3");

socket.on('clickedPosition', function(data){
    x = data.xposition;
    y = data.yposition;
    Field[x][y].revealed = true;

    tb.rows[x].cells[y].style.backgroundImage= 'url(img/tile02.png)';
    if(Field[x][y].unicorn==true){
        tb.rows[x].cells[y].innerHTML ="<img src='img/animal1.png' width=80%/>";
        tb.rows[x].cells[y].onclick=null;
        soundBomb.play();
        
        if(playerA){
            scoreA++;
            document.getElementById("labelA").innerHTML = scoreA;
        }
        else{
            scoreB++;
            document.getElementById("labelB").innerHTML = scoreB;
        }
        victoryCheck();
        timer.reset(1000);
    }
    
    else{
        tb.rows[x].cells[y].innerHTML ="<img src='img/tile02.png' width=80%/>";
        tb.rows[x].cells[y].onclick = null;
        soundNotBomb.play();      
        timer.reset(1000);
    }
    //bombCount=bombCount+1;
    //document.getElementById("bombCounter").innerHTML=bombCount;
});


//Timer
function Timer(fn,t) {
    var timerObj = setInterval(fn, t);

    this.stop = function() {
        if (timerObj) {
            clearInterval(timerObj);
            timerObj = null;
        }
        return this;
    }

    // start timer using current settings (if it's not already running)
    this.start = function() {
        if (!timerObj) {
            this.stop();
            timerObj = setInterval(fn, t);
        }
        return this;
    }

    // start with new interval, stop current interval
    this.reset = function(newT) {
        t = newT;
        document.getElementById("timer").innerHTML = "10";
        timeout = 10000;

        if(playerA){
            playerA=false;
            document.getElementById("turnA").innerHTML = "";
            document.getElementById("turnB").innerHTML = data.p2Name + "'s turn";
        }else{
            playerA=true;
            document.getElementById("turnA").innerHTML = data.p1Name + "'s turn";
            document.getElementById("turnB").innerHTML = "";
        }

        return this.stop().start();
    }

}

//Function to reveal the object
var x;
var y;
var tb = document.getElementById('tablegame');
function getIndex(get){
    x = get.parentNode.rowIndex;
    y = get.cellIndex;
    // cTurn = checkTurn();
    // tb = document.getElementById('table');
    if(checkTurn()){
        socket.emit('clickedPosition', {
            xposition: x,
            yposition: y
        });  
    }  
}
function checkTurn(){
    // tb.rows[x].cells[y].onclick=null;
    if((player == "A" && playerA) || (player == "B"&& !playerA)){
        return true;
    }else{
        return false;
    }
}

function popup(winner) {
 
    //Text
    popuptext = document.getElementById("popuptext");
    popuptext.innerHTML = "winner is " + winner;

    modal.style.display = "block";

}

function victoryCheck(){
    //document.getElementById("result").innerHTML = "checked";
    var scoreall = (scoreA + scoreB);
    document.getElementById("result").innerHTML = "Unicorn Left: " + (11 - scoreall);
    if (scoreA == 6 || scoreB == 6) {
        var text;
        if (scoreA == 6) {
            winner = "A";
            text = p1Name;
        }
        if (scoreB == 6) {
            winner = "B";
            text = p2Name;
        }
        //send winner to server
        socket.emit('whoWins', winner);
        document.getElementById("result").innerHTML = text + " wins";
        col.onclick = null;
        popup(text);
    }
    
}
function cell(x,y){
    this.x = x;
    this.y = y;
    this.revealed = false;
    this.unicorn = false;  
}

var row = $("<tr></tr>");
var col = "<td id='tile' onmouseenter='this.style.boxShadow=\"inset 0px 0px 20px 10px #99b7e8\"' onmouseleave='this.style.boxShadow=\"none\"'onclick = getIndex(this); style='background-color:#99b7e8;border:2px solid #b7cff7;width:70px;height:70px;color:red;font-size:30px;text-align:center;'></td>";

// Get the modal
var modal = document.getElementById('myModal');

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}

//START
function start(){
    if(player == "A"){
        socket.emit('a-press-start');
    } else if (player == "B"){
        socket.emit('b-press-start');
    }

    for(var i=0;i<size;i++){
        for(var j=0;j<size;j++){
            row.append(col);
        }
    $("#tablegame").append(row);
    row = $("<tr></tr>");
    }
    
    document.getElementById("defualt_field").style.display="none";
    document.getElementById("start").onclick = null;
    document.getElementById("result").innerHTML = "Unicorn Left: 11";

}

//Click OK
function nextRound(){
    socket.emit('reset',"newGame");
}

//RESTART
function restart(){
    socket.emit('reset', player);
    window.location.replace(window.location.href);
}
document.getElementById("restart").addEventListener("click",function(){
    restart();
});
socket.on('reset', function(){
    restart();
});
//HELP
var rules="\n::HOW TO PLAY Find My Unicorns::\n\nUncover the tiles one-by-one to find unicorns.\nEach player click the tile once, then switch to the other player.\nIf a unicorn was found, that player will get +1 score.\nThe player who get higher score will be the winner.";
document.getElementById("help").addEventListener("click",function(){alert(rules);});




//chat
var message = document.getElementById("message");
var btn = document.getElementById("send");
var output = document.getElementById("chatArea");
function sendMessase(){
    socket.emit('chat', message.value);
}
socket.on('chat', function(data){
    output.innerHTML += "&#13;&#10;"+data;
});