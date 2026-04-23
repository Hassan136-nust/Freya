const userModel = require ("../models/user.model")
const {validationResult}= require("express-validator")
const userService  = require ("../services/user.service");
const redisClient = require("../services/redis.service")
const createUserController= async (req,res)=>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()})
    }
    try{
        const user = await userService.createUser(req.body);
        
        const token  = await user.generateJWT();
        res.status(201).json({user,token});

    }
catch(error){
    res.status(400).send(error.message

    );
}

}


const loginController = async (req,res)=>{
    const errors = validationResult(req);


    if(!errors.isEmpty()){
        return res.status(400).json({
            errors:errors.array()
        })    }
try{
    const {email , password}= req.body;

    const user = await userModel.findOne({email}).select('+password');

    if(!user){
        res.status(401).json({errors:"Invalid user"})
    }

    const isMatch = await user.isValidPassword(password);


    if(!isMatch){
        return res.status(401).json({errors:"Invalid credentials"})
    }

    const token = await user.generateJWT();

    res.status(200).json({user,token})

}
catch(err){
    res.status(400).send(err.message)

}

}

const profileController = async (req,res)=>{
    res.status(200).json({
        user:req.user
    })
}


const logoutController= async (req,res)=>{
        try{
            const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

            try{
                redisClient.set(token,'logout', 'EX',60*60*24);
            }catch(redisErr){
                console.log("Redis set failed, logout will work but token won't be blacklisted")
            }

            res.status(200).json({
                message:"logout successfully"
            })
                    
        }
        catch(err){
            res.status(401).json({err})
        }
}


module.exports = {createUserController,loginController,profileController,logoutController}

