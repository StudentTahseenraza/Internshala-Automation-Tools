const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent';


const generateText = async (prompt) => {
    try {
        const response = await axios.post(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const generatedText = response.data.candidates[0].content.parts[0].text;
        return generatedText;
    } catch (error) {
        console.error('Error with Gemini API:', error.response ? error.response.data : error.message);
        throw new Error('Failed to generate text with Gemini API');
    }
};

module.exports = { generateText };