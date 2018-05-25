$(function () {
    var emit_info = new Array();
    var socket = io();
    emit_info[0] = 0;

    socket.emit('get_login');

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
      if(msg.substr(0, 6) == emit_info[0]){
        var messages_block = document.getElementById('messages');
        messages_block.children[0].style.marginLeft = '7%';
        messages_block.children[0].style.background = '#888';
      }
    });
    socket.on('hi', function(login){
      if(emit_info[0] == 0){
          emit_info[0] = login;
          $('#messages').prepend($('<li>').text("Your ID is " + login));
          socket.emit('login_accepted');
      }
      $('#messages').prepend($('<li>').text("Welcome " + login + "!"));
    });

    socket.on('set_login', function(login){
      emit_info[0] = login;
    });

    $('#sign_out').click(function(){
      socket.emit('logout');
      window.location.replace("/start_page/main.html");
    })
  });