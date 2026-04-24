import socket from "socket.io-client"
let socketInstance = null;

export const initializeSocket=(projectId)=>{
    socketInstance= socket(import.meta.env.VITE_API_URL,{
        auth:{
            token : localStorage.getItem('token'),

        },
        query:{
            projectId
        }

    })

    return socketInstance;
}

export const receiveMessage = (eventName,cb)=>{
    if (socketInstance) {
        socketInstance.off(eventName)
        socketInstance.on(eventName,cb)
    }
}

export const sendMessage = (eventName,data)=>{
    if (socketInstance) {
        console.log('Emitting event:', eventName, 'data:', data)
        socketInstance.emit(eventName,data)
    } else {
        console.error('Socket not initialized!')
    }
}



