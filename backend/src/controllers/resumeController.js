const { generateText } = require('../services/geminiService');

const optimizeResume = async (req, res) => {
    const { jobDescription, resumeText } = req.body;

    if (!jobDescription || !resumeText) {
        return res.status(400).json({ error: 'Job description and resume text are required' });
    }

    try {
        // Step 1: Analyze the resume and provide optimization suggestions
        const analysisPrompt = `
Analyze the following resume and job description to provide detailed suggestions for optimization:

**Resume:**
${resumeText}

**Job Description:**
${jobDescription}

Provide specific suggestions to improve the resume, including:
- Keywords to add or emphasize based on the job description.
- Skills or experiences to highlight.
- Sections to add or remove for better alignment.
- Formatting improvements for ATS compatibility (e.g., use of headings, bullet points).
Use professional language and structure the suggestions with bullet points (use \n- for each bullet).
`;
        const suggestions = await generateText(analysisPrompt);

        // Step 2: Optimize the resume
        const optimizationPrompt = `
Optimize the following resume for the given job description:

**Resume:**
${resumeText}

**Job Description:**
${jobDescription}

Optimize the resume by:
- Incorporating relevant keywords and skills from the job description.
- Tailoring the summary, experiences, and skills sections to align with the job.
- Using a professional, ATS-friendly format with clear headings and bullet points (separate with \n for new lines).
- Assume the applicant's name is "Alex Smith" with 2 years of relevant experience in the field mentioned in the job description.
`;
        const optimizedResume = await generateText(optimizationPrompt);

        // Step 3: Calculate ATS Score
        const atsPrompt = `
Evaluate the following resume for ATS compatibility based on the job description:

**Resume:**
${resumeText}

**Job Description:**
${jobDescription}

Calculate an ATS score (0-100) based on:
- Presence of relevant keywords (40% weight).
- Use of ATS-friendly formatting (e.g., clear headings, bullet points, no complex graphics) (30% weight).
- Alignment of skills and experiences with the job description (30% weight).
Return the score as a percentage (e.g., 85).
`;
        const atsScoreText = await generateText(atsPrompt);
        const atsScore = parseInt(atsScoreText.match(/\d+/)[0], 10); // Extract the numeric score

        res.json({ optimizedResume, suggestions, atsScore: `${atsScore}%` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { optimizeResume };