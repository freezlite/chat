"use strict";

class User{
    constructor(io, socket_id, nickname){
        this.io = io;
        this.nickname = nickname;
        this.socket_id = socket_id;
    }
    
    emit(event, message){
        this.io.to(this.socket_id).emit(event, message);
    }
    
    sendMessage(message){
        this.emit('message', message);
    }
    
    sendError(text){
        this.emit('error', text);
    }
    
    sendAnnouncment(text){
        this.emit('announcement', text);
    }
    
    sendUserList(nicknames){
        this.emit('users', nicknames);
    }

    changeName(nickname){
        this.nickname = nickname
    }
    
    static generateNickName(){
        return 'guest' + Math.floor((Math.random() * 100) + 1)
    }
}

global.User = User