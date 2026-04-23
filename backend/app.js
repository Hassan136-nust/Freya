require("dotenv").config();
const morgan = require("morgan");
const  express = require( "express")
const connectToDB= require ("./db/db")
const cookieParser = require("cookie-parser") 
const userRoutes = require("./routes/user.routes")
const projectRoutes = require("./routes/projects.routes")

const app = express();

const cors = require ("cors");

connectToDB();
app.use(morgan("dev"))
app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use("/users",userRoutes)

app.use("/projects",projectRoutes)
app.get("/",(req,res)=>{
    res.send("Jello");
});
module.exports= app;