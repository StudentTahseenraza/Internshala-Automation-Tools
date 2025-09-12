const fetch = require('node-fetch');
const cheerio = require('cheerio');
require('dotenv').config();

// Utility to parse HTML into structured sections
const parseJobDescription = (input) => {
    // Handle undefined, null, or non-string inputs
    if (!input || typeof input !== 'string') {
        return { 'Description': { heading: 'Description', content: [{ type: 'text', text: 'No description available' }] } };
    }

    const $ = cheerio.load(input);
    const sections = {};
    let currentSection = null;

    $('body').children().each((_, element) => {
        if ($(element).is('div.h3')) {
            currentSection = $(element).text().trim() || 'Description';
            sections[currentSection] = { heading: currentSection, content: [] };
        } else if ($(element).is('p, ul') && currentSection) {
            if ($(element).is('ul')) {
                const items = [];
                $(element).find('li').each((_, li) => {
                    const text = $(li).text().trim();
                    if (text) items.push(text);
                });
                if (items.length > 0) {
                    sections[currentSection].content.push({ type: 'list', items });
                }
            } else {
                const text = $(element).text().trim();
                if (text) {
                    sections[currentSection].content.push({ type: 'text', text });
                }
            }
        }
    });

    // Fallback if no sections are parsed
    if (Object.keys(sections).length === 0) {
        return { 'Description': { heading: 'Description', content: [{ type: 'text', text: input }] } };
    }

    return sections;
};

// Enhanced mock data for Internshala
const generateMockInternshalaData = ({ skills, field, minStipend, maxStipend }) => {
    const companies = ['TechTrend Innovations', 'GrowEasy Analytics', 'CodeZap Solutions', 'DigitalWave Ltd'];
    const locations = ['Remote', 'Bengaluru, KA', 'Mumbai, MH', 'Delhi, DL'];
    
    return Array.from({ length: 3 }, (_, i) => ({
        title: `${skills} Internship ${i + 1}`,
        company: companies[Math.floor(Math.random() * companies.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        salary: `${minStipend} - ${maxStipend} INR`,
        description: {
            'About the Company': {
                heading: 'About the Company',
                content: [{ type: 'text', text: `${companies[i % companies.length]} is a leading ${field} firm specializing in innovative solutions using ${skills}.` }]
            },
            'About the Internship': {
                heading: 'About the Internship',
                content: [
                    { type: 'text', text: `Join our ${field} team to work on projects requiring ${skills}.` },
                    { type: 'list', items: [
                        `Develop skills in ${skills}`,
                        'Collaborate with experienced professionals',
                        'Contribute to real-world projects'
                    ]}
                ]
            },
            'Requirements': {
                heading: 'Requirements',
                content: [{ type: 'list', items: [
                    `Basic knowledge of ${skills}`,
                    'Enthusiasm for learning',
                    'Good communication skills'
                ]}]
            }
        },
        url: `https://internshala.com/internship/detail/sample-internship-${i + 1}`,
        source: 'Internshala',
        datePosted: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
};

const fetchFromIndeed = async ({ skills, field, minStipend, maxStipend }, retries = 2, delay = 1000) => {
    try {
        const query = encodeURIComponent(`${skills} ${field}`);
        const response = await fetch(`https://indeed12.p.rapidapi.com/jobs/search?query=${query}&locality=in&start=1`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'indeed12.p.rapidapi.com',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY || 'c3335da44bmshe18bb9fec9ac1e9p1e6257jsn64a0c97c8f1a'
            }
        });

        if (response.status === 403) {
            throw new Error('Indeed API: Forbidden - Check API key or subscription');
        }
        if (response.status === 429) {
            throw new Error('Indeed API: Too Many Requests - Rate limit exceeded');
        }
        if (!response.ok) {
            throw new Error(`Indeed API error: ${response.statusText} (Status: ${response.status})`);
        }

        const data = await response.json();
        return data.hits.map(job => ({
            title: job.title,
            company: job.company_name,
            location: job.location || 'Not specified',
            salary: job.salary ? `${job.salary.min || minStipend} - ${job.salary.max || maxStipend} INR` : 'Not disclosed',
            description: job.description ? parseJobDescription(job.description) : { 'Description': { heading: 'Description', content: [{ type: 'text', text: 'No description available' }] } },
            url: job.url || `https://in.indeed.com/viewjob?jk=${job.jobkey}`,
            source: 'Indeed',
            datePosted: job.date_posted || new Date().toISOString()
        })).filter(job => {
            const salary = job.salary.match(/\d+/g) ? parseInt(job.salary.match(/\d+/g)[0]) : 0;
            return salary >= minStipend && salary <= maxStipend;
        });
    } catch (error) {
        console.error('Error fetching from Indeed:', error.message);
        if (retries > 0 && (error.message.includes('Forbidden') || error.message.includes('Too Many Requests'))) {
            console.log(`Retrying Indeed API (${retries} attempts left, waiting ${delay}ms)...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchFromIndeed({ skills, field, minStipend, maxStipend }, retries - 1, delay * 2);
        }
        return [];
    }
};

const fetchFromJSearch = async ({ skills, field, minStipend, maxStipend }, retries = 2, delay = 1000) => {
    try {
        const query = encodeURIComponent(`${skills} ${field} jobs`);
        const response = await fetch(`https://jsearch.p.rapidapi.com/search?query=${query}&page=1&num_pages=1&country=in&date_posted=all`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'jsearch.p.rapidapi.com',
                'x-rapidapi-key': process.env.RAPIDAPI_KEY
            }
        });

        if (response.status === 500) {
            throw new Error('JSearch API: Internal Server Error');
        }
        if (response.status === 429) {
            throw new Error('JSearch API: Too Many Requests - Rate limit exceeded');
        }
        if (!response.ok) {
            throw new Error(`JSearch API error: ${response.statusText} (Status: ${response.status})`);
        }

        const data = await response.json();
        return data.data.map(job => ({
            title: job.job_title,
            company: job.employer_name,
            location: job.job_city ? `${job.job_city}, ${job.job_state}, ${job.job_country}` : 'Not specified',
            salary: job.job_salary ? `${job.job_salary_min || minStipend} - ${job.job_salary_max || maxStipend} ${job.job_salary_currency || 'INR'}` : 'Not disclosed',
            description: job.job_description ? parseJobDescription(job.job_description) : { 'Description': { heading: 'Description', content: [{ type: 'text', text: 'No description available' }] } },
            url: job.job_apply_link || 'Not available',
            source: 'JSearch',
            datePosted: job.job_posted_at_datetime_utc || new Date().toISOString()
        })).filter(job => {
            const salary = job.salary.match(/\d+/g) ? parseInt(job.salary.match(/\d+/g)[0]) : 0;
            return salary >= minStipend && salary <= maxStipend;
        });
    } catch (error) {
        console.error('Error fetching from JSearch:', error.message);
        if (retries > 0 && (error.message.includes('Internal Server Error') || error.message.includes('Too Many Requests'))) {
            console.log(`Retrying JSearch API (${retries} attempts left, waiting ${delay}ms)...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchFromJSearch({ skills, field, minStipend, maxStipend }, retries - 1, delay * 2);
        }
        return [];
    }
};

const fetchFromRemotive = async ({ skills, field, minStipend, maxStipend }) => {
    try {
        const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(skills)}&category=${encodeURIComponent(field)}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Remotive API error: ${response.statusText} (Status: ${response.status})`);
        }

        const data = await response.json();
        return data.jobs.filter(job => {
            const salary = job.salary ? parseInt(job.salary.replace(/[^0-9]/g, '')) || 0 : 0;
            return salary >= minStipend && salary <= maxStipend;
        }).map(job => ({
            title: job.title,
            company: job.company_name,
            location: job.candidate_required_location || 'Remote',
            salary: job.salary || 'Not disclosed',
            description: job.description ? parseJobDescription(job.description) : { 'Description': { heading: 'Description', content: [{ type: 'text', text: 'No description available' }] } },
            url: job.url,
            source: 'Remotive',
            datePosted: job.publication_date || new Date().toISOString()
        }));
    } catch (error) {
        console.error('Error fetching from Remotive:', error.message);
        return [];
    }
};

const fetchFromInternshala = async ({ skills, field, minStipend, maxStipend }) => {
    try {
        // Placeholder for official Internshala API (uncomment and configure if available)
        /*
        const response = await fetch(`https://api.internshala.com/v1/internships?skills=${encodeURIComponent(skills)}&category=${encodeURIComponent(field)}&min_stipend=${minStipend}&max_stipend=${maxStipend}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer YOUR_INTERNSHALA_API_KEY',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Internshala API error: ${response.statusText} (Status: ${response.status})`);
        }

        const data = await response.json();
        return data.internships.map(job => ({
            title: job.title,
            company: job.company_name,
            location: job.location || 'Not specified',
            salary: job.stipend || `${minStipend} - ${maxStipend} INR`,
            description: job.description ? parseJobDescription(job.description) : { 'Description': { heading: 'Description', content: [{ type: 'text', text: 'No description available' }] } },
            url: job.url || 'https://internshala.com/internship/detail/sample-internship',
            source: 'Internshala',
            datePosted: job.posted_on || new Date().toISOString()
        }));
        */

        // Enhanced mock data
        return generateMockInternshalaData({ skills, field, minStipend, maxStipend });
    } catch (error) {
        console.error('Error fetching from Internshala:', error.message);
        return generateMockInternshalaData({ skills, field, minStipend, maxStipend });
    }
};

const fetchJobsFromMultiplePlatforms = async (req, res) => {
    const { platforms, skills, field, minStipend, maxStipend } = req.body;

    if (!platforms || !Array.isArray(platforms) || !skills || !field || !minStipend || !maxStipend) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const platformFetchers = {
            'Indeed': fetchFromIndeed,
            'JSearch': fetchFromJSearch,
            'Remotive': fetchFromRemotive,
            'Internshala': fetchFromInternshala
        };

        const fetchPromises = platforms.map(platform => {
            if (platformFetchers[platform]) {
                return platformFetchers[platform]({ skills, field, minStipend, maxStipend });
            }
            return Promise.resolve([]);
        });

        const results = await Promise.all(fetchPromises);
        const jobs = results.flat();

        res.status(200).json(jobs);
    } catch (error) {
        console.error('Error fetching jobs from platforms:', error.message);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

module.exports = { fetchJobsFromMultiplePlatforms };