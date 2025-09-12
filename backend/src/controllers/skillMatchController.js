const { queryHuggingFace } = require('../services/huggingFaceService');

const analyzeSkills = async (req, res) => {
    console.log('Received request at /api/skill-match:', req.body);

    if (!req.body) {
        return res.status(400).json({ error: 'Request body is missing' });
    }

    const { userSkills, jobRequirements } = req.body;

    if (!userSkills || !jobRequirements) {
        return res.status(400).json({ error: 'User skills and job requirements are required' });
    }

    let similarityScore;
    try {
        const model = 'sentence-transformers/all-MiniLM-L6-v2';
        const payload = {
            inputs: {
                source_sentence: userSkills,
                sentences: [jobRequirements]
            }
        };
        const result = await queryHuggingFace(model, payload);
        if (!result || !Array.isArray(result)) {
            throw new Error('Invalid response from Hugging Face API');
        }
        similarityScore = result[0];
    } catch (error) {
        console.error('Hugging Face API failed:', error.message);
        // Fallback: Simple keyword-matching similarity
        const userSkillsList = userSkills.toLowerCase().split(',').map(skill => skill.trim());
        const jobRequirementsList = jobRequirements.toLowerCase().split(',').map(req => req.trim());
        const matchingSkills = userSkillsList.filter(skill => 
            jobRequirementsList.some(req => req.includes(skill) || skill.includes(req))
        );
        similarityScore = matchingSkills.length / jobRequirementsList.length;
    }

    const userSkillsList = userSkills.toLowerCase().split(',').map(skill => skill.trim());
    const jobRequirementsList = jobRequirements.toLowerCase().split(',').map(req => req.trim());

    const missingSkills = jobRequirementsList.filter(req => 
        !userSkillsList.some(skill => skill.includes(req) || req.includes(skill))
    );

    let suggestions = '';
    if (missingSkills.length > 0) {
        suggestions = `Consider adding or emphasizing the following skills in your resume to better match the job: ${missingSkills.join(', ')}. `;
        if (similarityScore < 0.7) {
            suggestions += 'Focus on tailoring your experience to highlight these skills, or consider upskilling in these areas.';
        } else {
            suggestions += 'Adding these skills could make your application even stronger.';
        }
    } else {
        suggestions = 'Your skills are well-aligned with the job requirements. Ensure your resume highlights these skills with specific achievements or projects.';
    }

    const analysis = `Similarity score between your skills and the job requirements: ${(similarityScore * 100).toFixed(2)}%. ${
        similarityScore > 0.7 ? 'Your skills are a strong match for this job!' : 'You may need to highlight more relevant skills for this job.'
    }`;

    res.json({ analysis, similarityScore, missingSkills, suggestions });
};

module.exports = { analyzeSkills };