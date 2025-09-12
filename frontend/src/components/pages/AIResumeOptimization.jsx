import React, { useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

function AIResumeOptimization() {
    const [jobDescription, setJobDescription] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeText, setResumeText] = useState('');
    const [optimizedResume, setOptimizedResume] = useState('');
    const [suggestions, setSuggestions] = useState('');
    const [atsScore, setAtsScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');


    const API_BASE = import.meta.env.VITE_API_URL;


    // Set the worker source dynamically using import.meta.url
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url).toString();

    // Handle PDF file upload and extract text
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

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                text += pageText + '\n';
            }

            setResumeText(text);
        } catch (err) {
            setError(`Failed to extract text from the PDF: ${err.message}. Please ensure the PDF is not encrypted, contains selectable text, and try again.`);
        }
    };

    const handleOptimize = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setOptimizedResume('');
        setSuggestions('');
        setAtsScore(null);

        if (!resumeText) {
            setError('Please upload a resume to optimize.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE}/api/resume-optimize`, {
                jobDescription,
                resumeText
            });
            setOptimizedResume(response.data.optimizedResume);
            setSuggestions(response.data.suggestions);
            setAtsScore(response.data.atsScore);
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred while optimizing the resume.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(12);
        doc.text('Optimized Resume', 10, 10);
        doc.setFontSize(10);
        
        const lines = doc.splitTextToSize(optimizedResume, 180);
        doc.text(lines, 10, 20);
        
        doc.save('optimized-resume.pdf');
    };

    return (
        <div className="feature-page">
            <h2>AI Resume Optimization</h2>
            <p>Tailor your resume for each internship using AI assistance.</p>
            <form onSubmit={handleOptimize} className="feature-form">
                <label htmlFor="resume-file">Upload Your Resume (PDF):</label>
                <input
                    id="resume-file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                />
                {resumeText && (
                    <div className="result">
                        <h3>Extracted Resume Content:</h3>
                        <p style={{ whiteSpace: 'pre-line' }}>{resumeText}</p>
                    </div>
                )}
                <label htmlFor="job-description">Job Description:</label>
                <textarea
                    id="job-description"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    rows="5"
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Optimizing...' : 'Optimize Resume'}
                </button>
            </form>
            {error && <div className="error">{error}</div>}
            {(optimizedResume || suggestions || atsScore) && (
                <div className="result">
                    {suggestions && (
                        <>
                            <h3>Optimization Suggestions:</h3>
                            <p style={{ whiteSpace: 'pre-line' }}>{suggestions}</p>
                        </>
                    )}
                    {atsScore && (
                        <>
                            <h3>ATS Score:</h3>
                            <p>{atsScore} - {atsScore >= 80 ? 'Great score! Your resume is highly ATS-compatible.' : atsScore >= 60 ? 'Good score, but consider the suggestions to improve.' : 'Low score. Apply the suggestions to improve ATS compatibility.'}</p>
                        </>
                    )}
                    {optimizedResume && (
                        <>
                            <h3>Optimized Resume:</h3>
                            <p style={{ whiteSpace: 'pre-line' }}>{optimizedResume}</p>
                            <button onClick={handleDownloadPDF} className="download-btn">
                                Download as PDF
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default AIResumeOptimization;