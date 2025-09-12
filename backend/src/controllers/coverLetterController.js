const { generateText } = require('../services/geminiService');

const generateCoverLetter = async (req, res) => {
    const { jobDescription } = req.body;

    if (!jobDescription) {
        return res.status(400).json({ error: 'Job description is required' });
    }

    try {
        const prompt = `
Generate a polished, professional cover letter for a job application based on the following job description: ${jobDescription}. 
The cover letter should:
- Be formal and well-structured, with a proper greeting (e.g., "Dear Hiring Manager,") and closing (e.g., "Sincerely, [Your Name]").
- Include an introduction, a body highlighting relevant skills and experiences, and a conclusion.
- Use professional language, avoid repetition, and tailor the content to the job description.
- Format the letter with proper paragraphs (separate with \n for new lines).
- Assume the applicant's name is "Alex Smith" and they have 2 years of relevant experience in the field mentioned in the job description.
`;
        const coverLetter = await generateText(prompt);
        res.json({ coverLetter });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { generateCoverLetter };