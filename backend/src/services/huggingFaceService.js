const axios = require('axios');
require('dotenv').config();

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/';

const queryHuggingFace = async (model, payload) => {
    try {
        const response = await axios.post(
            `${HUGGINGFACE_API_URL}${model}`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error with Hugging Face API:', error.response ? error.response.data : error.message);
        throw new Error('Failed to query Hugging Face API');
    }
};

module.exports = { queryHuggingFace };