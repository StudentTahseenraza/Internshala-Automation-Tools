import React, { useState } from 'react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import './SkillsMatchAnalyzer.css';

function SkillMatchAnalyzer({ title, description }) {
    const [resumeFile, setResumeFile] = useState(null);
    const [userSkills, setUserSkills] = useState('');
    const [jobRequirements, setJobRequirements] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [missingSkills, setMissingSkills] = useState([]);
    const [suggestions, setSuggestions] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Set the worker source dynamically using import.meta.url
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url).toString();

    // Handle PDF file upload and extract skills
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !file.type.includes('pdf')) {
            setError('Please upload a valid PDF file.');
            return;
        }

        setResumeFile(file);
        setError('');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let text = '';

            // Extract text from all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                text += pageText + '\n';
            }

            // Extract skills section (heuristic: look for "Skills" section or comma-separated skills)
            const skillsMatch = text.match(/(Skills|Technical Skills|Key Skills|Proficiencies)[\s\S]*?(?=\n[A-Z]|\n\n|$)/i);
            let extractedSkills = '';

            if (skillsMatch) {
                extractedSkills = skillsMatch[0]
                    .replace(/(Skills|Technical Skills|Key Skills|Proficiencies)[\s:]+/i, '')
                    .replace(/\n/g, ', ')
                    .trim();
            } else {
                // Fallback: Look for comma-separated or bullet-pointed skills
                const lines = text.split('\n');
                const skillLines = lines.filter(line => line.includes(',') || line.startsWith('-') || line.startsWith('•'));
                extractedSkills = skillLines.join(', ').replace(/[-•]/g, '').trim();
            }

            setUserSkills(extractedSkills || 'No skills section found. Please enter skills manually.');
        } catch (err) {
            setError(`Failed to extract skills from the PDF: ${err.message}. Please ensure the PDF is not encrypted, contains selectable text, and try again.`);
        }
    };

    const handleAnalyze = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setAnalysis('');
        setMissingSkills([]);
        setSuggestions('');

        const trimmedUserSkills = userSkills.trim();
        const trimmedJobRequirements = jobRequirements.trim();

        if (!trimmedUserSkills || !trimmedJobRequirements) {
            setError('Please provide both your skills (via upload or manually) and job requirements.');
            setLoading(false);
            return;
        }

        const payload = { userSkills: trimmedUserSkills, jobRequirements: trimmedJobRequirements };
        console.log('Sending payload to backend:', payload);

        try {
            const response = await axios.post('http://localhost:5000/api/skill-match', payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            setAnalysis(response.data.analysis);
            setMissingSkills(response.data.missingSkills || []);
            setSuggestions(response.data.suggestions || '');
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred while analyzing skills.');
        } finally {
            setLoading(false);
        }
    };

    // Generate and download an improved resume as PDF
    const handleDownloadImprovedResume = async () => {
        if (!resumeFile) {
            setError('No resume file uploaded to improve.');
            return;
        }

        try {
            const arrayBuffer = await resumeFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let text = '';

            // Extract text from all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                text += pageText + '\n';
            }

            // Send the text and missing skills to the backend to generate a PDF
            const response = await axios.post('http://localhost:5000/api/generate-improved-resume', {
                text,
                missingSkills
            }, {
                responseType: 'blob' // Important: Treat the response as a binary blob (PDF)
            });

            // Trigger the PDF download
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'improved_resume.pdf');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError('Failed to generate improved resume: ' + err.message);
        }
    };

    return (
        <div className="feature-page">
            <h2>{title}</h2>
            <p>{description}</p>
            <form onSubmit={handleAnalyze} className="feature-form">
                <label htmlFor="resume-file">Upload Your Resume (PDF) to Extract Skills:</label>
                <input
                    id="resume-file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                />
                <label htmlFor="user-skills">Your Skills (Edit if needed):</label>
                <textarea
                    id="user-skills"
                    value={userSkills}
                    onChange={(e) => setUserSkills(e.target.value)}
                    placeholder="e.g., Python, JavaScript, Teamwork"
                    rows="3"
                />
                <label htmlFor="job-requirements">Job Requirements:</label>
                <textarea
                    id="job-requirements"
                    value={jobRequirements}
                    onChange={(e) => setJobRequirements(e.target.value)}
                    placeholder="e.g., Python, 2 years of experience, Problem-solving"
                    rows="3"
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Analyzing...' : 'Analyze Skills'}
                </button>
            </form>
            {error && <div className="error">{error}</div>}
            {analysis && (
                <div className="result">
                    <h3>Skill Match Analysis:</h3>
                    <p>{analysis}</p>
                    {missingSkills.length > 0 && (
                        <>
                            <h4>Missing Skills:</h4>
                            <ul>
                                {missingSkills.map((skill, index) => (
                                    <li key={index}>{skill}</li>
                                ))}
                            </ul>
                        </>
                    )}
                    {suggestions && (
                        <>
                            <h4>Improvement Suggestions:</h4>
                            <p>{suggestions}</p>
                            <button onClick={handleDownloadImprovedResume}>
                                Download Improved Resume (PDF)
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default SkillMatchAnalyzer;