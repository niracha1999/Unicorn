var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

// var serverPageConnected = 0;

server.listen(5000, '0.0.0.0');
console.log('Server Running port 5000');

players=[0,"A","B"];
connections=[null, null];
numCon = [];
rooms =[];
var row =[];
var Field=[];
var size = 6;
var p1clicked = false;
var p2clicked = false;
var startPlayer;
var p1Name;
var p2Name;

app.use(express.static("public"));


//Creating a Layout
for(var i=0;i<size;i++){
    for(var j=0;j<size;j++){
        row.push({});
    }
    Field.push(row);
    row=[]
}

//Initializing the array to store unicorn 
for(var i=0;i<size;i++){
    for(var j=0;j<size;j++){
        Field[i][j] = new cell(i,j);
    }
}

//use randomUnicorn() method to random number into each array 
//Initializing the Unicorn array
for(var i=0;i<size+5;i++){
    randomUnicorn();
}

//random unicorn position from above (6 times)
function randomUnicorn(){
    var x = Math.floor(Math.random()*size);
    var y = Math.floor(Math.random()*size);
    if(Field[x][y].unicorn){
        randomUnicorn()
    }
    Field[x][y].unicorn = true;
}

//tell location of the cell 
//initializing revealed to False (reveal means has clicked or not)
function cell(x,y){
    this.x = x;
    this.y = y;
    this.revealed = false;
    this.unicorn = false;  
}


//Random A and B for who starts
function randomStartPlayer(){ 
    var ranNum = Math.floor(Math.random()*3)%2;
    if(ranNum == 0){
        startPlayer = "A";
    } else{
        startPlayer = "B";
    }
}

//socket :
//.emit = server send to every client(does not choose a particular socket)
//.on = check if there is any clients(socket) connect
//.join = door to server 

//when connect --> show number of client
io.sockets.on('connection', function(socket){  


    socket.on('joinRoom', function(roomID){
        socket.join(roomID);
        var room = io.sockets.adapter.rooms[roomID];
        console.log('new user to '+roomID+' : This room has '+room.length+' adventurer(s).');
        var a = 'new user to '+roomID+' : This room has '+room.length+' adventurer(s).';
        numCon.push(socket);
        console.log('%s sockets connected', numCon.length);
        var b = (numCon.length-1)+' sockets connected';
        io.sockets.emit('numPlayerInRoom', {
            a: a,
            b: b
        });

    //connection 
    let playerIndex;    
    if(roomID != "serverRoom"){
        //Find Available player number 0,1,-1
        playerIndex = -1;
        for( var i in connections){

            if(connections[i] === null){
                playerIndex = i;
            }
        }

        //Tell the connecting client what player number they are
        socket.emit('player-number', playerIndex);
        //Ignore Player 3
        if (playerIndex == -1) return;

        connections[playerIndex] = socket;

        //Tell everyone ekse what number player just connected
        socket.broadcast.emit('player-connect', playerIndex);
    
    }

        //Recieve Player name
        socket.on('playerAName', function(data){
            p1Name = data;
            console.log(p1Name);
            io.sockets.emit('playerAName', {
                p1Name: p1Name,
                p2Name: p2Name
            });
        });

        socket.on('playerBName', function(data){
            p2Name = data;
            console.log(p2Name);
            io.sockets.emit('playerBName', {
                p1Name: p1Name,
                p2Name: p2Name
            });
        });

        //Disconnect
        socket.on('disconnect', function(data){
            numCon.splice(connections.indexOf(socket), 1);
            console.log('Disconnected: %s socket remain connected', numCon.length);
            io.sockets.emit('playerDisconnected', 'Player 1 is disconnected, '+(numCon.length-1)+' sockets connected.');
            // console.log('Player ${playerIndex} Disconnected');
            connections[playerIndex] = null;
        });

        //To make sure both of them clicked start
        //to start game!!!!!!!!!!!
        socket.on('a-press-start', function(){
            p1clicked = true;
            console.log('Player 1 had clicked start: A:'+p1clicked+" B:"+p2clicked);
            if(p1clicked && p2clicked){
                // console.log('Starttttttt');
                io.sockets.emit('gameStarted', 'The game has started');
                randomStartPlayer();
                
                io.sockets.emit('canStart', {
                    cs: true,
                    field: Field,
                    startPlayer: startPlayer
                });
                var tt;
                if(startPlayer == "A"){
                    tt = p1Name;
                } else{
                    tt = p2Name;
                }
                //return who start
                console.log('Start with '+ tt);
            } 
        });
        socket.on('b-press-start', function(){
            p2clicked = true;
                console.log('Player 2 had clicked start: A: '+p1clicked+" B: "+p2clicked);
            if(p1clicked && p2clicked){
                io.sockets.emit('gameStarted', 'The game has started');
                randomStartPlayer();
                io.sockets.emit('canStart', {
                    cs: true,
                    field: Field,
                    startPlayer: startPlayer
                });
                // $('defualt_field').hidden();
                
                console.log('Start with '+ startPlayer);
            } 
        });


        //Connect the positions
        socket.on('clickedPosition', function(data){
            io.sockets.emit('clickedPosition', {
                xposition: data.xposition,
                yposition: data.yposition
            });
        });

        //to reset/restart the game
        socket.on('reset', function(data){
        	//send reset socket
            io.sockets.emit('reset');
            socket.disconnect();
            if(data == "A"){
                console.log('A has clicked RESTART');
                io.sockets.emit('announcement', 'A has clicked RESTART');
                p1clicked = false;
                p2clicked = false;
            } else if(data == "B") {
                console.log('B has clicked RESTART');
                io.sockets.emit('announcement', 'B has clicked RESTART');
                p1clicked = false;
                p2clicked = false;
            }else if(data == "server"){
                console.log("Console has clicked RESTART");
                io.sockets.emit('announcement', 'Server clicked RESTART');
                p1clicked = false;
                p2clicked = false;
                io.sockets.emit('reset');
                connections = [null,null];
            }else if(data == "newGame"){
                console.log("Starting new game");
                io.sockets.emit('announcement', 'start the game');
                p1clicked = false;
                p2clicked = false;
                io.sockets.emit('reset');
                connections = [null,null];
            }
        });


        //Who wins
        socket.on('whoWins', function(data){
            startPlayer = data;
            var ttt = data+' wins...';
            io.sockets.emit('whoWinsforServer', ttt);
            console.log(data+' wins...');
        });


        //chating box/console
        socket.on('chat', function(data){
            io.sockets.emit('chat', data);
        });
        
    });

});

