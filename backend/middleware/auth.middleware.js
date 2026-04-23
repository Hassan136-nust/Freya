const jwt = require ("jsonwebtoken");
const redisClient = require("../services/redis.service")
const authUser = async (req,res,next)=>{
    try{
        const token = req.cookies.token  || req.headers.authorization?.split(' ')[1];

            if(!token){
                return res.status(401).send({error:"Unatyhorized User"})
            }

            try{
                const isBlacklisted = await redisClient.get(token);

                if(isBlacklisted){

                    res.cookie('token','')
                    return res.status(401).send({
                        error:"Unauthorized"
                    })
                }
            }catch(redisErr){
                console.log("Redis check failed, continuing without blacklist check")
            }



        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user= decoded;
        next();
    }
    catch (error){
        res.status(401).send({error:"Please authenticate"})
    }
}

module.exports= {authUser}