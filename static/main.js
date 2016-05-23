var socket = io();
var is_self_join = true;
var nickname = '';

$('form').submit(function() {
    socket.emit('message', $('#m').val());
    $('#m').val('');
    return false;
});

socket.on('nickname', function(data){
    nickname = data;
});

socket.on('message', function(data) {
    if (data instanceof Array) {
        for (var i in data) {
            $('#messages').append($('<li>').html(stringFromData(data[i])));
        }
    } else {
        $('#messages').append($('<li>').html(stringFromData(data)));
        if (data['nickname'] != nickname){
            document.getElementById('notify').play();
        }
    }
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
});

socket.on('users', function(data){
   for (var i in data) {
       var li = $('<li></li>').text(data[i]);
       $('#users_online').append(li);
   }
});

socket.on('disconnect', function() {
    $('#users_online').empty()
    is_self_join = true
})

socket.on('announcement', function(count) {
    $('#messages').append($('<li>').html(count));
});

socket.on('left', function(nickname){
    var msg = nickname + ' has left the chat';
    $('#messages').append($('<li>').html(msg));
    $('#users_online>li:contains("' + nickname + '")').remove();
});

socket.on('join', function(nickname){
    if (is_self_join) {
        is_self_join = false;
    }else{
        var msg = nickname + ' has join the chat';
        $('#messages').append($('<li>').html(msg));
        var li = $('<li></li>').text(nickname);
        $('#users_online').append(li);
    }
});

socket.on('change users count', function(count) {
    $('#users').text('Users count: ' + count);
});

socket.on('error', function(msg) {
    alert(msg);
});

socket.on('change nickname', function(data){
    var msg = data[0] + ' changed nickname to ' + data[1];
    $('#messages').append($('<li>').html(msg));
    $('#users_online>li:contains("' + data[0] + '")').text(data[1]);
})

function stringFromData(data){
    var local_time = new Date(data['timestamp']);
    var time_string = addZero(local_time.getHours()) + ':' + addZero(local_time.getMinutes()) + ':' + addZero(local_time.getSeconds());
    var msg = time_string + ' ' + data['nickname'] +': '+ data['msg'];
    return msg;
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

$('#hide').click(function() {
    if($('#messages_container').hasClass('col-md-10')){
        $('#users_container').hide();
        $('#messages_container').toggleClass('col-md-10 col-md-12');
        $('#hide').html('&#x25C0;');
    }else{
        $('#users_container').show();
        $('#messages_container').toggleClass('col-md-12 col-md-10');
        $('#hide').html('&#x25B6;');
    }
})