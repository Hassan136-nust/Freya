const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    name:{
        type:String,
        lowercase:true,
        required:true,
        trim:true,
        unique:[true,"Project name Should be unique"],
    },

    users:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
}

],
    files: [
        {
            name: {
                type: String,
                required: true,
                trim: true
            },
            content: {
                type: String,
                default: ""
            },
            language: {
                type: String,
                default: "plaintext"
            }
        }
    ]
})

const Project = mongoose.model('project',projectSchema)

module.exports= Project;