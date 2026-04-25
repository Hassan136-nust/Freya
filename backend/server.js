require("dotenv").config();
const http = require("http");
const app = require("./app");
const jwt = require("jsonwebtoken")
const PORT = process.env.PORT || 3000;
const mongoose = require ("mongoose")

const generateResult = require("./services/ai.service")

const projectModel = require("./models/project.model")
const server = http.createServer(app);
const io = require('socket.io')(server,{
    cors:{
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        const projectId = socket.handshake.query.projectId;
        
        if(!mongoose.Types.ObjectId.isValid(projectId)){
            return next(new Error("invalid id"))
        }
        socket.project = await projectModel.findById(projectId)

        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
});

io.on('connection', (socket) => {
    console.log("Connected");

    socket.join(socket.project._id.toString())

    socket.on('project-message', async data => {
        const message = data.message;
        const aiIsPresentInMessage = message.includes('@freya')
        
        if(aiIsPresentInMessage){
            const prompt = message.replace('@freya','');
            
            // FIRST: Broadcast the user's original message to others
            socket.broadcast.to(socket.project._id.toString()).emit('project-message', data)
            
            // Create a unique ID for this AI message
            const aiMessageId = Date.now().toString() + '-ai';
            
            // Emit an initial empty message
            io.to(socket.project._id.toString()).emit('project-message', {
                _id: aiMessageId,
                sender: 'Freya-AI',
                message: '',
                isNew: true,
                timestamp: new Date()
            });

            // THEN: Generate and send Freya's response (don't await here)
            generateResult(prompt, (chunk) => {
                // Emit chunks to EVERYONE in the room
                io.to(socket.project._id.toString()).emit('project-message', {
                    _id: aiMessageId,
                    sender: 'Freya-AI',
                    message: chunk,
                    isChunk: true,
                    timestamp: new Date()
                });
            }).catch(err => {
                console.error("AI Generation Error in Socket:", err);
            });
        } else {
            
            socket.broadcast.to(socket.project._id.toString()).emit('project-message', data)
        }
    })
    
    // Handle file updates for real-time collaboration
    socket.on('file-update', (data) => {
        console.log('📝 File update from:', data.updatedBy, 'file:', data.fileName, 'content length:', data.content?.length)
        console.log('Broadcasting to room:', socket.project._id.toString())
        // Broadcast to all other users in the project room
        socket.broadcast.to(socket.project._id.toString()).emit('file-update', data)
        console.log('✅ Broadcasted file-update')
    })
    
    // Handle new file creation
    socket.on('file-created', (data) => {
        console.log('📁 File created by:', data.createdBy, 'file:', data.file.name)
        // Broadcast to all other users in the project room
        socket.broadcast.to(socket.project._id.toString()).emit('file-created', data)
        console.log('✅ Broadcasted file-created')
    })
    
    // Handle file deletion
    socket.on('file-deleted', (data) => {
        console.log('🗑️ File deleted by:', data.deletedBy, 'file:', data.fileName)
        // Broadcast to all other users in the project room
        socket.broadcast.to(socket.project._id.toString()).emit('file-deleted', data)
        console.log('✅ Broadcasted file-deleted')
    })
    
    socket.on('event', (data) => {});
    socket.on('disconnect', () => {});
});

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});