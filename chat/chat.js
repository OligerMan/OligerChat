function showRoomList(room_list){
    $('#room_list').empty();
    for(var i = 0; i < room_list.length; i++){
        $('#room_list').append('\
        <div class="room_button" id="room' + i + '">\
            ' + room_list[i].name + '\
        </div>');
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

    $('#choose_room').click(function(){
        if(!isFindLine){
            socket.emit('get_room_list');
            $('form').css('display', 'none');
            $('#messages').css('display', 'none');
            $('.block').css('display', 'flex').animate({opacity: 1, top: '50%'}, 1000);
            isFindLine = true;
        }
        else{
            $('form').css('display', 'flex');
            $('#messages').css('display', 'flex');
            $('.block').css('display', 'none').animate({opacity: 1, top: '50%'}, 1000);
            isFindLine = false;
        }
    });

    $('#line').change(function(){
        socket.emit('get_room_list');
    });

    socket.on('set_room_list', function(room_list){
        showRoomList(room_list);
    });

    socket.on('room_connect', function(messages){
        $('form').css('display', 'flex');
        $('#messages').css('display', 'flex');
        $('.block').css('display', 'none').animate({opacity: 1, top: '50%'}, 1000);
        isFindLine = false;
        addMessages(messages, emit_info[0]);
    });
});