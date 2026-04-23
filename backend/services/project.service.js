const { default: mongoose } = require("mongoose");
const projectModel = require("../models/project.model");


const createProject = async({
    name, userId

})=>{
    if(!name){
        throw new Error('Name is required')
    }

    if(!userId){
        throw new Error ("UserId required")
    }

    const project = await projectModel.create({
        name,
        users:[userId]
    })
return project
}

const getAllProjectByUserId= async ({userId})=>{
    if(!userId){
        throw new Error("UserId is Required")
    }

    const allUserProjects = await projectModel.find({
        users:userId
    })
return allUserProjects
}


const addUsersToProject = async ({
    projectId,
    users,userId,
}) => {
    if (!projectId) {
        throw new Error("projectId is required");
    }

    if (!users) {
        throw new Error("users are required");
    }

    // Check if projectId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId format");
    }

    // Check if users is an array
    if (!Array.isArray(users)) {
        throw new Error("users must be an array");
    }

    // Check if all user IDs in the array are valid MongoDB ObjectIds
    for (let i = 0; i < users.length; i++) {
        if (!mongoose.Types.ObjectId.isValid(users[i])) {
            throw new Error(`Invalid user ID format at index ${i}: ${users[i]}`);
        }
    }

    if(!userId){
        throw new Error("userId required")
    }

    if(!mongoose.Types.ObjectId.isValid(userId)){
         throw new Error("Invalid id")
    }
const project = await projectModel.findOne({
    _id:projectId,
    users:userId,
})

if(!project){
     throw new Error("user does not belong to project")
}

const updatedProject = await projectModel.findOne({
    _id:projectId

},
{
    $addToSet:{
        users:{
            $each:users
        }
    }
},{
    new:true
})
return updatedProject
}

module.exports= {createProject,getAllProjectByUserId,addUsersToProject};