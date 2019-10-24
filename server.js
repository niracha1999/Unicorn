var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
players=[0,"A","B"];
connections=[null, null];
numCon = [];
rooms =[];
var row =[];
var Field=[];
var SIZE = 6;
var aPressed = false;
var bPressed = false;
var startPlayer;
var aName;
var bName;
// var serverPageConnected = 0;

server.listen(5000, '0.0.0.0');
console.log('Server Running port 5000.....');

app.use(express.static("public"));


//Creating a Layout
for(var i=0;i<SIZE;i++){
    for(var j=0;j<SIZE;j++){
        row.push({});
    }
    Field.push(row);
    row=[]
}
//Initializing the Objects
for(var i=0;i<SIZE;i++){
    for(var j=0;j<SIZE;j++){
        Field[i][j] = new cell(i,j);
    }
}
//Initializing the BOMBS..!
for(var i=0;i<SIZE+5;i++){
    ranodomMine();
}
function ranodomMine(){
    var x = Math.floor(Math.random()*SIZE);
    var y = Math.floor(Math.random()*SIZE);
    if(Field[x][y].bomb){
        ranodomMine()
    }
    Field[x][y].bomb = true;
}
function cell(x,y){
    this.x = x;
    this.y = y;
    this.revealed = false;
    this.bomb = false;  
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


io.sockets.on('connection', function(socket){  


    socket.on('joinRoom', function(roomID){
        socket.join(roomID);
        var room = io.sockets.adapter.rooms[roomID];
        console.log('new user to '+roomID+' : This room has '+room.length+' people.');
        var a = 'new user to '+roomID+' : This room has '+room.length+' people.';
        numCon.push(socket);
        console.log('Connected %s sockets connected', numCon.length);
        var b = (numCon.length-1)+' sockets connected';
        io.sockets.emit('numPlayerInRoom', {
            a: a,
            b: b
        });


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
            aName = data;
            console.log(aName);
            io.sockets.emit('playerAName', {
                aName: aName,
                bName: bName
            });
        });

        socket.on('playerBName', function(data){
            bName = data;
            console.log(bName);
            io.sockets.emit('playerBName', {
                aName: aName,
                bName: bName
            });
        });

        //Disconnect
        socket.on('disconnect', function(data){
            numCon.splice(connections.indexOf(socket), 1);
            console.log('Disconnected %s sockets connected', numCon.length);
            io.sockets.emit('playerDisconnected', 'A player is disconnected, '+(numCon.length-1)+' sockets connected.');
            // console.log('Player ${playerIndex} Disconnected');
            connections[playerIndex] = null;
        });

        //To make sure both of them pressed start
        socket.on('a-press-start', function(){
            aPressed = true;
            console.log('a had pressed start: A:'+aPressed+" B:"+bPressed);
            if(aPressed && bPressed){
                // console.log('Starttttttt');
                io.sockets.emit('gameStarted', 'The game has started');
                randomStartPlayer();
                
                io.sockets.emit('canStart', {
                    cs: true,
                    field: Field,
                    startPlayer: startPlayer
                });
                // $('defualt_field').hidden();
                var tt;
                if(startPlayer == "A"){
                    tt = aName;
                } else{
                    tt = bName;
                }
                console.log('Starttttttt by '+ tt);
            } 
        });
        socket.on('b-press-start', function(){
            bPressed = true;
                console.log('b had pressed start: A: '+aPressed+" B: "+bPressed);
            if(aPressed && bPressed){
                io.sockets.emit('gameStarted', 'The game has started');
                randomStartPlayer();
                io.sockets.emit('canStart', {
                    cs: true,
                    field: Field,
                    startPlayer: startPlayer
                });
                // $('defualt_field').hidden();
                
                console.log('Starttttttt by '+ startPlayer);
            } 
        });


        //Connect the positions
        socket.on('clickedPosition', function(data){
            io.sockets.emit('clickedPosition', {
                xposition: data.xposition,
                yposition: data.yposition
            });
        });

        //reset
        socket.on('reset', function(data){
            io.sockets.emit('reset');
            socket.disconnect();
            if(data == "A"){
                console.log('A has pressed RESTART');
                io.sockets.emit('announcement', 'A has pressed RESTART');
                aPressed = false;
                bPressed = false;
            } else if(data == "B") {
                console.log('B has pressed RESTART');
                io.sockets.emit('announcement', 'B has pressed RESTART');
                aPressed = false;
                bPressed = false;
            }else if(data == "server"){
                console.log("Console has pressed RESTART");
                io.sockets.emit('announcement', 'Server pressed RESTART');
                aPressed = false;
                bPressed = false;
                io.sockets.emit('reset');
                connections = [null,null];
            }else if(data == "newGame"){
                console.log("Starting new game");
                io.sockets.emit('announcement', 'STARTING NEW GAME!!!!!!!!');
                aPressed = false;
                bPressed = false;
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


        //chat
        socket.on('chat', function(data){
            io.sockets.emit('chat', data);
        });
        
    });

    
    // socket.on('canStart', function(){
    //     console.log('Server recieved canStart'+aPressed+bPressed);
    //     if(aPressed && bPressed){
    //         console.log('Starttttttt');
    //         socket.emit('canStart', true);
    //     } 
    // });

    


    




    // socket.on('room', function(room){
    //     socket.join(room);
    //     // rooms.push(room);
    //     io.sockets.in(room).emit('message', connections.length);
    // });

    // //Assign Player
    // socket.on('assignPlayer', function(){
    //     io.sockets.in(room).emit('assignPlayer', randomPlayer());
    // });
    // function randomPlayer(){
        
    // };

    // socket.on('checkNumberPlayer', function(){
    //     io.sockets.in(room).emit('checkNumberPlayer', connections.length);
    // });
});

