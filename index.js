var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var session = require("express-session")({
    secret: "secret",
    resave: true,
    saveUninitialized: true
});
var sharedsession = require("express-socket.io-session");
var sha256 = require('js-sha256');

app.use(session);

io.use(sharedsession(session), {
    autoSave: true
});


/////////////////////////////////////////////////////


var last_user = 100000;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/start_page/main.html');
});

app.use('/chat', express.static(__dirname + '/chat'));

app.use('/start_page', express.static(__dirname + '/start_page'));


/////////////////////////////////////////////////////

class Message{
    constructor(room_name, nickname, text){
        this.hash = sha256(nickname + text + toString(getTime()));
        this.text = text;

    }
}

class User{
    constructor(login, password_hash){
        this.login = login;
        this.hash = password_hash;
        this.score = 0;
        this.recent_rooms = new Array;
    }
}

class ChatRoom{
    constructor(name, private_status){
        this.messages = new Array();
        this.name = name;
        this.status = private_status;
        this.members = new Array();
    }
}

/////////////////////////////////////////////////////

var users = new Array();

var existing_rooms = new Array();

function isRoomNameUsed(room_name){
    for(i = 0; i < existing_rooms.length; i++){
        if(room_name.trim() == existing_rooms[i].name.trim()){
            return true;
        }
    }
    return false;
}

function getRoomId(room_name){
    for(i = 0; i < existing_rooms.length; i++){
        if(room_name.trim() == existing_rooms[i].name.trim()){
            return i;
        }
    }
    return -1;
}

function createRoom(name, private_status){
    existing_rooms.push(new ChatRoom(name, private_status));
}

function isLoginUsed(login){
    for(i = 0; i < users.length; i++){
        if(login.trim() == users[i].login.trim()){
            return true;
        }
    }
    return false;
}

function getHash(login){
    if(isLoginUsed(login)){
        for(i = 0; i < users.length; i++){
            if(login.trim() == users[i].login.trim()){
                return users[i].hash;
            }
        }
    }
    return '';
}

/////////////////////////////////////////////////////

function welcomeMessage(socket){
    socket.emit('chat_message', 'Welcome!!!');
    socket.emit('chat_message', 'This is global chat without message save, if you want to save your messages, try to enter to room or create your room');
    socket.emit('chat_message', 'P.S. Rooms search is not working now, sorry');
    socket.emit('chat_message', 'There are some commands for you:');
    socket.emit('chat_message', '!newroom <room_name> - creates new public room');
    socket.emit('chat_message', '!myID - returns your nickname');
    socket.emit('chat_message', '!help - shows this message');
}

/////////////////////////////////////////////////////


io.on('connection', function(socket){

    if(socket.handshake.session.islogged >= 5){
        socket.disconnect();
        console.log('Connection refused');
        return;
    }
    else{
        socket.handshake.session.islogged += 1;
        socket.handshake.session.save();
    }

    var logged_as = undefined;
    var current_room = undefined;
    var first_time = false;

    if(socket.handshake.session.logged_as){
        logged_as = socket.handshake.session.logged_as;
        socket.emit('login_success');
    }

    var accepted = false;

    socket.on('disconnect', function(){
        socket.handshake.session.islogged -= 1;
        socket.handshake.session.logged_as = logged_as;
        socket.handshake.session.save();
    });

    socket.on('chat_message', function(emit_info){
        if(current_room != undefined && logged_as != undefined && emit_info[1].trim().length != 0){
            if(emit_info[0] != logged_as){
                socket.emit('chat_message', 'Don\'t try to change nickname, lul ' + emit_info[0] + ' is not ' + logged_as);
            }
            else if(emit_info[1].length < 300){
                console.log('message: ' + emit_info[1] + ' from user ' + logged_as + ' to room ' + existing_rooms[current_room].name);
                io.emit('chat_message', logged_as + ': ' + emit_info[1]);
                existing_rooms[current_room].messages.push(logged_as + ': ' + emit_info[1]);
            }
            else{
                console.log('Spam from ' + logged_as);
                socket.emit('chat_message', logged_as + ' don\'t spam pls. You can\'t send more than 300 symbols');
            }
        }
    });

    socket.on('cheatcode', function(msg){
        var cmd = msg.trim();
        if(cmd == 'myID'){
            socket.emit('chat_message', 'Your ID is ' + logged_as);
        }
        else if(cmd.substr(0,7) == 'newroom'){
            //var status = +msg.substr(8,1);
            var status = 0;

            var new_room = new ChatRoom(msg.substr(8), status);
            //var new_room = new ChatRoom(msg.substr(10), status);

            new_room.members.push(logged_as);
            existing_rooms.push(new_room);
            console.log('Room ' + new_room.name + ' created with status ' + status);
        }
        else if(cmd == 'help'){
            socket.emit('chat_message', 'There are some commands for you:');
            socket.emit('chat_message', '   !newroom <room_name> - creates new public room');
            socket.emit('chat_message', '   !myID - returns your nickname');
            socket.emit('chat_message', '   !help - shows this message');
        }
        else{
            socket.emit('chat_message', 'Wrong command');
            console.log('Wrong command');
        }
    });

    socket.on('register', function(login, password){
        login = login.trim();

        if(login.length == 0){
            socket.emit('error_code', 'Please enter your login');
            return;
        }
        if(password.length < 8){
            socket.emit('error_code', 'Password must be 8 symbols at least');
            return;
        }

        var hash = sha256(password);

        if(!isLoginUsed(login)){
            users.push(new User(login, sha256(password)));
            socket.handshake.session.logged_as = login;
            logged_as = login;

            console.log("User " + login + ' registered');
            socket.emit('register_success');
            first_time = true;
        }
        else{
            socket.emit('error_code', 'Login already used');
        }
    });

    socket.on('get_login', function(){
        socket.emit('set_login', logged_as);
        welcomeMessage(socket);
    });

    socket.on('login', function(login, password){
        login = login.trim();

        if(login.length == 0){
            socket.emit('error_code', 'Please enter your login');
            return;
        }
        if(password.length < 8){
            socket.emit('error_code', 'Password must be 8 symbols at least');
            return;
        }

        if(getHash(login) == sha256(password)){
            logged_as = login;
            socket.handshake.session.logged_as = login;
            socket.emit('login_success');
            console.log('User ' + login + ' logged in');
        }else{
            socket.emit('error_code', 'Login failed');
        }
    });

    socket.on('logout', function(){
        console.log('User ' + logged_as + ' logged out')
        logged_as = undefined;
        socket.handshake.session.logged_as = undefined;
        current_room = undefined;
    });

    socket.on('get_room_list', function(){
        socket.emit('set_room_list', existing_rooms);
    });

    socket.on('room_connect', function(room_name){
        
        var room_id = getRoomId(room_name);

        if(!existing_rooms[room_id].status){
            current_room = room_id;
            socket.emit('room_connect', existing_rooms[room_id].messages);
            console.log('User ' + logged_as + ' entered to room ' + room_name.trim());
        }
        else{
            socket.emit('chat_message', 'This room is private');
        }
    });
});

var port = process.env.PORT || 5000;

http.listen(port, function(){
    console.log('listening on port ' + port);
});