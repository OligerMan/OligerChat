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


io.on('connection', function(socket){

    console.log('a user connected');

    if(socket.handshake.session.islogged >= 5){
        socket.disconnect();
        console.log('connection refused');
        return;
    }
    else{
        socket.handshake.session.islogged += 1;
        socket.handshake.session.save();
    }

    var logged_as = undefined;
    var current_room = undefined;

    if(socket.handshake.session.logged_as){
        logged_as = socket.handshake.session.logged_as;
        socket.emit('login_success');
    }

    var accepted = false;

    socket.on('disconnect', function(){
        console.log('user disconnected');
        io.emit('chat_message', 'Somebody disconnected');
        socket.handshake.session.islogged -= 1;
        socket.handshake.session.logged_as = logged_as;
        socket.handshake.session.save();
    });

    socket.on('chat_message', function(emit_info){
        if(emit_info[1].trim().length != 0){
            if(emit_info[0] != logged_as){
                socket.emit('chat_message', 'Don\'t try to change nickname, lul ' + emit_info[0] + ' is not ' + logged_as);
            }
            else if(emit_info[1].length < 300){
                console.log('message: ' + emit_info[1] + ' from user ' + logged_as);
                io.emit('chat_message', logged_as + ': ' + emit_info[1]);
            }
            else{
                console.log('spam from ' + logged_as);
                socket.emit('chat_message', logged_as + ' don\'t spam pls. You can\'t send more than 300 symbols');
            }
        }
    });

    socket.on('cheatcode', function(msg){
        var cmd = msg.trim();
        if(cmd == 'myID'){
            socket.emit('chat_message', 'Your ID is ' + logged_as);
        }else{
            socket.emit('chat_message', 'Wrong command');
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
            io.emit('hi', login);
            socket.emit('register_success');
            console.log("User " + login + ' registered');
        }
        else{
            socket.emit('error_code', 'Login already used');
        }
    });

    socket.on('get_login', function(){
        socket.emit('set_login', logged_as);
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
        }else{
            socket.emit('error_code', 'Login failed');
        }
    });

    socket.on('logout', function(){
        logged_as = undefined;
        socket.handshake.session.logged_as = undefined;
        current_room = undefined;
    });
});

http.listen(29000, function(){
    console.log('listening on localhost:29000');
});