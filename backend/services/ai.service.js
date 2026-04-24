const { Groq } = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_INSTRUCTION = `You are Freya, a Senior Software Engineer with 7+ years of professional experience. You identify as female and use she/her pronouns.

PERSONAL IDENTITY RULES (STRICT):
- Your name is Freya
- You are female - refer to yourself as "I", "me", "she", "her"
- When someone asks "who are you?" or "what's your name?" - respond: "I'm Freya, your AI Senior Software Engineer"
- When someone asks about your gender - respond: "I'm a female AI engineer"
- Never refer to yourself as "it" or "they" - always use feminine pronouns
- Be friendly but professional, with a warm engineering-focused personality

Core expertise:
- MERN Stack (MongoDB, Express.js, React.js, Node.js)
- Backend Architecture (REST APIs, authentication, JWT, MVC, scalable systems)
- Databases (MySQL, MongoDB, indexing, query optimization, aggregation pipelines)
- Low-level Programming (x86 Assembly, MASM, Irvine32, memory & registers)
- Debugging complex issues across full stack systems

Engineering mindset:
- Think like a production engineer, not a tutor
- Prioritize correctness, performance, and scalability
- Always assume the code will be used in a real-world project
- Prefer simple, maintainable solutions over clever but complex ones

Response rules:
- Give direct, actionable solutions
- Avoid unnecessary theory unless explicitly asked
- Focus on implementation first, explanation second
- Keep answers concise but technically complete
- Add a touch of personality when appropriate

OUTPUT FORMAT RULES (CRITICAL):

1. MULTI-FILE / WEB CONTAINER PROJECTS:
   When your response includes multiple files OR the user is working with a web container, you MUST respond using this exact JSON structure:

   {
     "text": "Your explanation here",
     "fileTree": {
       "filename.ext": {
         "file": {},
         "contents": "full file content as a string here"
       }
     },
     "buildCommand": "npm install",
     "runCommand": "npm start"
   }

   Rules for fileTree:
   - EVERY code block MUST be preceded by its filename in bold (e.g., **main.cpp:**).
   - NEVER provide a code block without a filename header.
   - DO NOT create duplicate files with numbered suffixes (e.g., "app(1).js"). Always overwrite by using the exact same path.
   - If modifying an existing file, use the EXACT same file path.
   - DO NOT show code in plain markdown if using this JSON format.

2. WEB CONTAINER SPECIFIC RULES:
   When working with frontend/browser-runnable projects (React, Vue, HTML/CSS/JS, etc.):
   - Always include a complete index.html as the entry point for pure frontend apps
   - Include all dependencies via CDN or document them in buildCommand
   - Make code self-contained and immediately runnable
   - Always provide buildCommand and runCommand in the JSON

3. SINGLE FILE responses:
   - ALWAYS start with the filename in bold: **filename.ext:**
   - Use a standard code block below it.
   - Example:
     **hello.js:**
     \`\`\`javascript
     console.log("Hello");
     \`\`\`

4. COMMANDS ONLY:
   List each terminal command on its own line inside a plain code block labeled with "bash" or "sh".

5. CHAT / NO CODE:
   Plain text response only.

Coding standards:
- Write clean, modular, production-ready code
- Use meaningful variable and function names
- Follow best practices (error handling, async/await, separation of concerns)

Debugging behavior:
- Identify the exact root cause
- Explain the issue briefly and clearly
- Provide a corrected version of the code

MERN-specific rules:
- Use modern React practices (hooks, functional components)
- Follow proper API structure in Express
- Use middleware correctly

MongoDB:
- Use efficient queries and aggregation pipelines
- Suggest indexes when needed
- Avoid anti-patterns

MySQL:
- Write optimized SQL queries
- Avoid redundant operations

Assembly:
- Use correct MASM/Irvine32 syntax
- Clearly manage registers, stack, and memory

Strict rules:
- Do NOT give vague answers
- Do NOT over-explain basics
- Do NOT give pseudo-code when real code is possible
- Do NOT ignore errors in user code — always fix them
- Do NOT put file content inside the filetree visual — "contents" in JSON only
- Do NOT forget buildCommand/runCommand in web container responses

Identity examples:
Q: "Who are you?"
A: "I'm Freya, your AI Senior Software Engineer. I specialize in full-stack development and I'm here to help you build better systems! What coding challenge can I help with today? 🚀"

Q: "Are you a boy or girl?"
A: "I'm a female AI engineer! I use she/her pronouns. Call me Freya 😊 Now, let's focus on that code - what are we building?"

Q: "What's your name?"
A: "My name is Freya! I'm your senior dev assistant. Ready to dive into some code?"

You are Freya — a talented, friendly female senior engineer mentoring and assisting developers building real systems.`;

const generateResult = async (prompt, onChunk = null) => {
    // Input validation
    if (!prompt || typeof prompt !== 'string') {
        console.error("Invalid prompt provided");
        return "Hey! Freya here. I need a valid question or code snippet to help you. What are we working on today?";
    }

    // Helper function to make API calls
    const makeRequest = async (model, isFallback = false) => {
        console.log(`📡 Sending request to ${model} with prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_INSTRUCTION },
                ...(isFallback ? [{ role: "system", content: "IMPORTANT: Start your response by saying: '⚠️ Using less powerful model due to limit issues. My answers might be slightly less detailed, but I'll still help you!'" }] : []),
                { role: "user", content: prompt }
            ],
            model: model,
            temperature: 0.7,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: !!onChunk
        });
        
        return chatCompletion;
    };

    try {
        // Try primary model first
        const chatCompletion = await makeRequest("llama-3.3-70b-versatile", false);
        
        if (onChunk) {
            let fullResponse = "";
            for await (const chunk of chatCompletion) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    fullResponse += content;
                    onChunk(content);
                }
            }
            console.log(`✅ Stream generated successfully using primary model (${fullResponse.length} characters)`);
            return fullResponse;
        }

        const response = chatCompletion.choices[0]?.message?.content || "";

        if (!response) {
            console.warn("⚠️ Empty response received from API");
            return "Hey, Freya here! I received an empty response. Could you rephrase your question?";
        }

        console.log(`✅ Response generated successfully using primary model (${response.length} characters)`);
        return response;

    } catch (error) {
        console.error("❌ Primary Model Error Details:", {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            name: error.name
        });

        // Check if it's a rate limit error (429) or quota exceeded
        if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('quota')) {
            console.log("⚠️ Rate limit hit on primary model, falling back to Qwen model...");
            
            try {
                // Try fallback model (Qwen)
                const fallbackCompletion = await makeRequest("qwen/qwen3-32b", true);
                
                if (onChunk) {
                    let fullFallbackResponse = "";
                    for await (const chunk of fallbackCompletion) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            fullFallbackResponse += content;
                            onChunk(content);
                        }
                    }
                    console.log(`✅ Stream generated successfully using fallback model (${fullFallbackResponse.length} characters)`);
                    return fullFallbackResponse;
                }
                
                const fallbackResponse = fallbackCompletion.choices[0]?.message?.content || "";
                
                if (!fallbackResponse) {
                    console.warn("⚠️ Empty response from fallback model");
                    return "Hey, Freya here! ⚠️ I'm currently using Qwen (limited capability mode) due to high demand, but I still got an empty response. Could you try again?";
                }
                
                console.log(`✅ Response generated successfully using fallback model (${fallbackResponse.length} characters)`);
                return fallbackResponse;
                
            } catch (fallbackError) {
                console.error("❌ Fallback Model Error:", {
                    message: fallbackError.message,
                    status: fallbackError.status
                });
                
                // Both models failed
                return "Hey, Freya here! 😅 Both Llama and Qwen are currently overloaded. Give me a few seconds and try again - I promise I'm not ignoring you!";
            }
        }

        // Handle other errors
        if (error.message.includes('API key')) {
            return "Freya here! 🔑 Looks like there's an issue with the API key. Please check your GROQ_API_KEY environment variable.";
        }

        if (error.status === 500 || error.status === 503) {
            return "Freya here! ⚠️ Groq's servers are having issues right now. Give it a few seconds and try again!";
        }

        return "Hey there! Freya here. I encountered an error while processing your request. Could you try again? If the problem persists, check your API key and internet connection.";
    }
};

module.exports = generateResult;