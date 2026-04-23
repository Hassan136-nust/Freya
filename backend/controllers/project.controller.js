const projectModel = require("../models/project.model");
const userModel = require("../models/user.model");
const projectService = require("../services/project.service");
const { validationResult } = require("express-validator"); 

const createProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    try {
        const { name } = req.body;
        const loggedInUser = await userModel.findOne({ email: req.user.email }); // Fixed: use req.user.email

        if (!loggedInUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = loggedInUser._id;

        const newProject = await projectService.createProject({ name, userId });

        res.status(201).json(newProject);
    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }
}


const getAllProject= async (req,res)=>{
try{
    const loggedInUser = await userModel.findOne({email:req.user.email})

    const allUserProjects = await projectService.getAllProjectByUserId({
        userId:loggedInUser._id
    })
    return res.status(200).json({
        projects:allUserProjects
    })
}

catch(err){
    console.log(err)
    res.status(400).json({error:err.message})
}
}


const addUserToProject = async (req ,res)=>{

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors:errors.array()
        })
    }

    try{

        const {projectId, users}=req.body;

        const loggedInUser= await userModel.findOne({
            email:req.user.email
        })

        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId:loggedInUser._id
        })
return res.status(200).json({
    project
})
    }
    catch(err){
        res.status(400).json({
            error:err.message
        })
    }

}
const getProjectById= async (req,res)=>{
    const {projectId}=req.params;

    try{
        const project = await projectService.getProjectById({projectId})

        return res.status(200).json({
            project
        })
    }
    catch(err){
        res.status(400).json({error:err.message})
    }
}

module.exports = { createProject,getAllProject,addUserToProject,getProjectById }; 