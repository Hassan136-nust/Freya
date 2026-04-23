
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

module.exports = {createUser}