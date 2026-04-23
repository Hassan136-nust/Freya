const {GoogleGenerativeAI}= require("@google/generative-ai")   

const genAi = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY)

const model = genAi.getGenerativeModel({model:"gemini-2.5-flash-lite"});

const generateResult = async (prompt)=>{
    const result = await model.generateContent(prompt);
return result.response.text()
}

module.exports = generateResult;