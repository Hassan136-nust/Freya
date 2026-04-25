import socket from "socket.io-client"
let socketInstance = null;

export const initializeSocket=(projectId)=>{
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    
    socketInstance= socket(backendUrl,{
        auth:{
            token : localStorage.getItem('token'),
        },
        query:{
            projectId
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    })

    socketInstance.on('connect', () => {
        console.log('✅ Socket connected:', socketInstance.id)
    })

    socketInstance.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason)
    })

    socketInstance.on('connect_error', (error) => {
        console.error('🔴 Socket connection error:', error.message)
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



