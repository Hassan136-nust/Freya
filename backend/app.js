require("dotenv").config();
const morgan = require("morgan");
const  express = require( "express")
const connectToDB= require ("./db/db")
const cookieParser = require("cookie-parser") 
const userRoutes = require("./routes/user.routes")
const projectRoutes = require("./routes/projects.routes")
const router = require("./routes/ai.routes")
const app = express();

const cors = require ("cors");

connectToDB();

app.get("/", (req, res) => {
    res.send("Freya API running");
});


app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "freya-backend",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.use(morgan("dev"))
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use("/users",userRoutes)

app.use("/projects",projectRoutes)
app.use("/ai",router)
module.exports= app;