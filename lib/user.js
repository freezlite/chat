"use strict";

class User{
    constructor(io, socket_id){
        this.io = io;
        this.nickname = User.generateNickName();
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
    
    static generateNickName(){
        return 'guest' + Math.floor((Math.random() * 100) + 1)
    }
}

global.User = User