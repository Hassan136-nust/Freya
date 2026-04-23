
const userModel = require ("../models/user.model")

const createUser = async ({
    email, password
})=>{
    if(!email){
        throw new Error("email required")
    }

    const hashPassword= await userModel.hashPassword(password);
const user = await userModel.create({
    email, password:hashPassword
})

return user
}

const getAllUsers= async ({userId})=>{
    const users = await userModel.find({
        _id:{$ne:userId}
    });

    return users;
}

module.exports = {createUser,getAllUsers}