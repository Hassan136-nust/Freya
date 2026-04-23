require("dotenv").config();
const http = require("http");
const app = require("./app");
const jwt = require("jsonwebtoken")
const PORT = process.env.PORT || 3000;
const mongoose = require ("mongoose")
const projectModel = require("./models/project.model")
const server = http.createServer(app);
const io = require('socket.io')(server,{
    cors:{
        origin:'*'
    }
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

    socket.on('project-message',data=>{
        socket.broadcast.to(socket.project._id.toString()).emit('project-message',data)
    })
    socket.on('event', (data) => {});

    socket.on('disconnect', () => {});
});

server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});