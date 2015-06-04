var socket = io();
$('form').submit(function() {
    socket.emit('message', $('#m').val());
    $('#m').val('');
    return false;
});
socket.on('message', function(data) {
    if (data instanceof Array) {
        for (var i in data) {
            $('#messages').append($('<li>').html(stringFromData(data[i])));
        }
    } else {
        $('#messages').append($('<li>').html(stringFromData(data)));
    }
    window.scrollTo(0, document.body.scrollHeight + 42);
});
socket.on('announcement', function(count) {
    $('#messages').append($('<li>').html(count));
});
socket.on('left', function(nickname){
    var msg = nickname + ' has left the chat';
    $('#messages').append($('<li>').html(msg));
});
socket.on('join', function(nickname){
    var msg = nickname + ' has join the chat';
    $('#messages').append($('<li>').html(msg));
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
})

function stringFromData(data){
    var local_time = new Date(data['timestamp']);
    var time_string = local_time.getHours() + ':' + local_time.getMinutes() + ':' + local_time.getSeconds();
    var msg = time_string + ' ' + data['nickname'] +': '+ data['msg'];
    return msg;
}