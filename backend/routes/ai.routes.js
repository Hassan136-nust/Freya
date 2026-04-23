
const {Router} = require("express");

const getResult = require("../controllers/ai.controller"); 
const router = Router();

router.get("/get-result", getResult);

module.exports= router