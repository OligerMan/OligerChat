$(function(){

    var form_state = 'login';

    var socket = io();

    ////////////
    // form transform
    ////////////

    $('#register_button').click(function(){
        if(form_state == 'login'){
            $('.input_block').append('<input class="input_form" id="confirm_password_form" type="password" autocomplete="off"/>');
            $('.form_name_dict').append('<div class="form_name" id="confirm_form_name">Confirm password: </div>');
            $('#login_form').css('border-color', '');
            $('#password_form').css('border-color', '');
            $('#login_title').text('Register');
            form_state = 'register';
            $('#login_type_form').attr('id', 'register_type_form');
        }
        else if(form_state == 'register'){
            var login = $('#login_form').val();
            var password = $('#password_form').val();
            var confirm_password = $('#confirm_password_form').val();
            
            var fail = false;

            if(login.trim() == ''){
                $('#login_form').css('border-color', 'red');
                alert('Please enter your login');
                fail = true;
            }else{
                $('#login_form').css('border-color', '');
            }
            if(!fail && password.trim() == ''){
                $('#password_form').css('border-color', 'red');
                alert('Please enter password');
                fail = true;
            }else{
                $('#password_form').css('border-color', '');
            }
            if(!fail && confirm_password.trim() == ''){
                $('#confirm_password_form').css('border-color', 'red');
                alert('Please repeat password');
                fail = true;
            }else{
                $('#confirm_password_form').css('border-color', '');
            }
            if(!fail && password != confirm_password){
                $('#password_form').css('border-color', 'red');
                $('#confirm_password_form').css('border-color', 'red');
                alert('Passwords not match');
                fail = true;
            }
            if(!fail && password.length < 8){
                $('password_form').css('border-color', 'red');
                alert('Password must be 8 symbols at least');
                fail = true;
            }

            if(!fail){
                socket.emit('register', login, password);
            }
        }
    });
    $('#sign_in_button').click(function(){
        if(form_state == 'register'){
            $('#confirm_password_form').remove();
            $('#confirm_form_name').remove();
            $('#login_form').css('border-color', '');
            $('#password_form').css('border-color', '');
            $('#login_title').text('Sign in');
            form_state = 'login';
            $('#register_type_form').attr('id', 'login_type_form');
        }
        else if(form_state == 'login'){
            var login = $('#login_form').val();
            var password = $('#password_form').val();
            
            var fail = false;

            if(login.trim() == ''){
                $('#login_form').css('border-color', 'red');
                fail = true;
            }else{
                $('#login_form').css('border-color', '');
            }
            if(password.trim() == ''){
                $('#password_form').css('border-color', 'red');
                fail = true;
            }else{
                $('#password_form').css('border-color', '');
            }

            if(!fail){
                socket.emit('login', login, password);
            }
        }
    });

    socket.on('login_success', function(){
        window.location.replace("/chat/chat.html");

    });

    socket.on('register_success', function(){
        window.location.replace("/chat/chat.html");
    });

    socket.on('error_code', function(error){
        alert(error);
    });
})