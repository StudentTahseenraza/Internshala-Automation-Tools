const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const natural = require('natural');
const TfIdf = natural.TfIdf;
const NodeCache = require('node-cache');
const fs = require('fs').promises;

puppeteer.use(StealthPlugin());

// Initialize cache with a TTL of 1 hour
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

// Helper function for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock internship data for fallback
const mockInternships = [
    {
        title: 'Software Development Intern',
        company: 'TechCorp',
        stipend: '₹10,000/month',
        link: 'https://internshala.com/internship/detail/software-development-intern',
        score: 80,
    },
    {
        title: 'Data Science Intern',
        company: 'DataWorks',
        stipend: '₹8,000/month',
        link: 'https://internshala.com/internship/detail/data-science-intern',
        score: 75,
    },
    {
        title: 'Marketing Intern',
        company: 'Brandify',
        stipend: '₹5,000/month',
        link: 'https://internshala.com/internship/detail/marketing-internship',
        score: 70,
    },
];

// Function to mock filter internships
const mockFilterInternships = (skills, minStipend, maxStipend) => {
    const skillsLower = skills.toLowerCase().trim();
    const minStipendNum = parseInt(minStipend) || 0;
    const maxStipendNum = parseInt(maxStipend) || 1000000;

    return mockInternships.filter(internship => {
        const stipendNum = parseInt(internship.stipend.match(/₹([\d,]+)/)?.[1].replace(/,/g, '')) || 0;
        const stipendMatch = stipendNum >= minStipendNum && stipendNum <= maxStipendNum;
        const skillMatch = internship.title.toLowerCase().includes(skillsLower);
        return stipendMatch && skillMatch;
    }).slice(0, 5);
};

// Function to scrape internship listings
const scrapeInternships = async (page, skills, minStipend, maxStipend) => {
    console.log('Starting internship scraping...');
    const internships = new Map();
    let pageNum = 1;

    if (!page) {
        console.error('Page object is undefined at start');
        return Array.from(internships.values());
    }

    try {
        const roleFilterSelector = '#keywords, input[name="keywords"], #search_internships, .search-box input';
        console.log('Waiting for selector:', roleFilterSelector);
        await page.waitForSelector(roleFilterSelector, { timeout: 15000 });
        if (!page) {
            console.error('Page object is undefined after waitForSelector');
            return Array.from(internships.values());
        }
        const skillsLower = skills.toLowerCase().trim();
        let roleKeyword = '';
        if (skillsLower.includes('python') || skillsLower.includes('javascript') || skillsLower.includes('html') || skillsLower.includes('css') || skillsLower.includes('java')) {
            roleKeyword = 'Software Development';
        } else if (skillsLower.includes('data') || skillsLower.includes('machine learning') || skillsLower.includes('sql')) {
            roleKeyword = 'Data Science';
        } else {
            roleKeyword = skills; // Avoid marketing/other mappings
        }
        console.log('Typing keyword:', roleKeyword);
        await page.type(roleFilterSelector, roleKeyword, { delay: 100 });
        await page.keyboard.press('Enter');
        console.log('Waiting for search results to load...');
        await delay(3000);

        while (pageNum <= 3) {
            console.log(`Scraping page ${pageNum}...`);
            try {
                if (!page) {
                    console.error('Page object is invalid on page', pageNum);
                    break;
                }
                await delay(2000);
                const pageInternships = await page.evaluate(() => {
                    const internshipCards = document.querySelectorAll('.internship_meta, .individual_internship, .internship-card, .internship_list_item');
                    const results = [];
                    for (const card of internshipCards) {
                        const titleElement = card.querySelector('.company_name, .internship-title, .job-title, .title, .heading_4_5 a');
                        let title = titleElement?.innerText?.trim() || 'N/A';
                        title = title.replace(/Actively hiring\s*/i, '');

                        const companyElement = card.querySelector('.company_name, .organization, .company, .view_detail_button');
                        let company = companyElement?.innerText?.trim() || 'N/A';
                        company = company.replace(/Actively hiring\s*/i, '');

                        // Updated department selector - inspect Internshala to find the correct class
                        const departmentElement = card.querySelector('.internship-meta__category, .category'); // Adjust based on inspection
                        let department = departmentElement?.innerText?.trim() || 'N/A';

                        const stipendElement = card.querySelector('.stipend, .salary, .stipend_container span');
                        const stipend = stipendElement?.innerText?.trim() || 'N/A';

                        const linkElement = card.querySelector('a[href*="/internship/detail"], a.view_detail_button');
                        const link = linkElement?.href || 'N/A';

                        if (title !== 'N/A' && company !== 'N/A' && link !== 'N/A' && stipend !== 'N/A') {
                            results.push({ title, company, stipend, link, department });
                        }
                    }
                    return results;
                });

                pageInternships.forEach(internship => internships.set(internship.link, internship));

                const nextButton = await page.$('.pagination .next, .next-page, a.next');
                if (nextButton && pageNum < 3) {
                    await nextButton.click();
                    await delay(3000);
                    pageNum++;
                } else {
                    break;
                }
            } catch (innerError) {
                console.error(`Error scraping page ${pageNum}:`, innerError.message);
                break;
            }
        }
    } catch (error) {
        console.error('Scraping error:', error.message);
    }

    console.log(`Scraped ${internships.size} internships`);
    return Array.from(internships.values());
};

const recommendInternships = async (req, res) => {
    const { skills, minStipend, maxStipend, email, password } = req.body;

    if (!skills) {
        return res.status(400).json({ error: 'Skills are required' });
    }

    if (typeof skills !== 'string') {
        return res.status(400).json({ error: 'Skills must be a string' });
    }

    const minStipendNum = parseInt(minStipend) || 0;
    const maxStipendNum = parseInt(maxStipend) || 1000000;

    const cacheKey = `${skills}_${minStipend}_${maxStipend}`;
    const cachedInternships = cache.get(cacheKey);
    if (cachedInternships) {
        console.log('Returning cached internships...');
        return res.json(cachedInternships);
    }

    let browser;
    let page;
    try {
        console.log('Launching Puppeteer browser...');
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
            timeout: 60000,
        });
        page = await browser.newPage();
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        ];
        await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
        await page.setViewport({ width: 1280, height: 720 });

        let cookies;
        try {
            cookies = JSON.parse(await fs.readFile('cookies.json'));
            await page.setCookie(...cookies);
            console.log('Loaded saved cookies');
        } catch (error) {
            console.log('No cookies found, attempting login...');
            if (email && password) {
                await page.goto('https://internshala.com/login', { waitUntil: 'networkidle2', timeout: 60000 });
                await page.type('input[name="email"]', email, { delay: 100 });
                await page.type('input[name="password"]', password, { delay: 100 });
                await page.click('button[type="submit"]');
                await delay(5000);
                if (page.url().includes('login')) {
                    throw new Error('Login failed');
                }
                cookies = await page.cookies();
                await fs.writeFile('cookies.json', JSON.stringify(cookies, null, 2));
                console.log('Login successful, cookies saved');
            } else {
                throw new Error('No cookies or credentials provided');
            }
        }

        await page.goto('https://internshala.com/internships', { waitUntil: 'networkidle2', timeout: 60000 });

        if (page.url().includes('login')) {
            throw new Error('Invalid cookies, login required');
        }

        const internships = await scrapeInternships(page, skills, minStipendNum, maxStipendNum);

        const filteredInternships = internships.filter(internship => {
            let stipendNum = 0;
            const stipendMatch = internship.stipend.match(/₹\s*([\d,]+)(?:-([\d,]+))?\s*\/?\s*(month)?/i);
            if (stipendMatch) {
                const lowerStipend = parseInt(stipendMatch[1].replace(/,/g, '')) || 0;
                const upperStipend = stipendMatch[2] ? parseInt(stipendMatch[2].replace(/,/g, '')) : lowerStipend;
                stipendNum = (lowerStipend + upperStipend) / 2;
            }
            const isITRelated = internship.title.toLowerCase().includes('software') || 
                               internship.title.toLowerCase().includes('developer') || 
                               internship.title.toLowerCase().includes('programmer') || 
                               internship.company.toLowerCase().includes('tech') || 
                               internship.department.toLowerCase().includes('it') || 
                               internship.department.toLowerCase().includes('technology');
            console.log(`Stipend: ${internship.stipend}, Parsed: ${stipendNum}, Range: ${minStipendNum}-${maxStipendNum}, IT-Related: ${isITRelated}`);
            return stipendNum >= minStipendNum && stipendNum <= maxStipendNum && isITRelated;
        });

        const tfidf = new TfIdf();
        const skillsLower = skills.toLowerCase().trim();
        tfidf.addDocument(skillsLower);
        filteredInternships.forEach((internship, index) => {
            const internshipText = `${internship.title} ${internship.company} ${internship.department || ''}`.toLowerCase();
            tfidf.addDocument(internshipText);
        });

        const scoredInternships = filteredInternships.map((internship, index) => {
            let similarityScore = 0;
            tfidf.tfidfs(skillsLower, (i, measure) => {
                if (i === 0) similarityScore = measure;
            });
            const normalizedScore = Math.min(100, (similarityScore * 200).toFixed(2)); // Increase sensitivity
            return { ...internship, score: normalizedScore >= 70 ? normalizedScore : 0 }; // Stricter threshold
        }).filter(internship => internship.score > 0);

        const sortedInternships = scoredInternships
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        console.log(`Found ${sortedInternships.length} matching internships:`, sortedInternships);

        const responseData = { recommendations: sortedInternships, appliedCount: 0 };
        cache.set(cacheKey, responseData);
        await browser.close();
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching internships:', error.message, error.stack);
        if (browser) {
            try {
                if (page && !page.isClosed()) {
                    await page.screenshot({ path: 'error-screenshot.png' });
                }
            } catch (screenshotError) {
                console.error('Failed to take error screenshot:', screenshotError.message);
            }
            await browser.close();
        }
        const mockResults = mockFilterInternships(skills, minStipend, maxStipend);
        const responseData = { recommendations: mockResults, appliedCount: 0 };
        cache.set(cacheKey, responseData);
        res.json(responseData);
    }
};

module.exports = { recommendInternships };