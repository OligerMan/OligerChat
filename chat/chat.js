function showRoomList(room_list, search){
    $('#room_list').empty();

    for(var i = 0; i < room_list.length; i++){
        var status = room_list[i].name.indexOf(search) + 1;
        if(status){
            $('#room_list').append('\
            <div class="room_button" id="room' + i + '">\
                ' + room_list[i].name + '\
            </div>');
        }
    }
}

function addMessages(msg_list, login){
    $('#messages').empty();
    for(var i = 0; i < msg_list.length; i++){
        $('#messages').prepend($('<li>').text(msg_list[i]));
        if(msg_list[i].substr(0, login.length) == login){
            var messages_block = document.getElementById('messages');
            messages_block.children[0].style.marginLeft = '7%';
            messages_block.children[0].style.background = '#888';
        }
    }
}


$(function () {
    var emit_info = new Array();
    var socket = io();

    emit_info[0] = 0;

    socket.emit('get_login');
    
    socket.emit('get_room_list');

    $('#room_list').on("click", ".room_button", function(){
        var room_name = $(this).text();
        socket.emit('room_connect', room_name);
    });

    $('form').submit(function(){
        emit_info[1] = $('#m').val();
        if(emit_info[1].trim()[0] == '!'){
            var command = emit_info[1].trim().substr(1);
            socket.emit('cheatcode', command);
        }
        else{
            socket.emit('chat_message', emit_info);
        }
        $('#m').val('');
        return false;
    });

    socket.on('chat_message', function(msg){
        $('#messages').prepend($('<li>').text(msg));
        if(msg.substr(0, emit_info[0].length) == emit_info[0]){
            var messages_block = document.getElementById('messages');
            messages_block.children[0].style.marginLeft = '7%';
            messages_block.children[0].style.background = '#888';
        }
    });
    
    socket.on('set_login', function(login){
        emit_info[0] = login;
    });

    $('#sign_out').click(function(){
        socket.emit('logout');
        window.location.replace("/start_page/main.html");
    });

    var isFindLine = false;

    $('#line').keyup(function(){
        socket.emit('get_room_list');
    });

    socket.on('set_room_list', function(room_list){
        showRoomList(room_list, $('#line').val());
    });

    socket.on('room_connect', function(messages, room_name){
        isFindLine = false;
        addMessages(messages, emit_info[0]);
        
        room_name = room_name.trim();
        if(room_name.length > 15){
            room_name = room_name.substr(0, 12) + '...';
        }
        $('.block_title').text('Current room: ' + room_name);
    });

    socket.on('update_room_list', function(){
        socket.emit('get_room_list');
    });
});