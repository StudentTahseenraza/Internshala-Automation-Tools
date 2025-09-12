const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;

puppeteer.use(StealthPlugin());

const cookiesFilePath = 'cookies.json';

// Helper function for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to set up the browser and page with stealth
const setupBrowserAndPage = async (headless = true) => {
    const browser = await puppeteer.launch({
        headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 720 });
    return { browser, page };
};

// Helper function to handle overlays with optimized loop
const handleOverlays = async (page) => {
    let overlayCount = 0;
    while (overlayCount < 5) {
        const overlay = await page.$('.modal-backdrop, .popup-overlay, .overlay, .modal, .intershala-modal');
        if (!overlay) break;
        console.log(`Overlay found (${++overlayCount}), attempting to close...`);
        await page.evaluate(() => {
            const overlay = document.querySelector('.modal-backdrop, .popup-overlay, .overlay, .modal, .intershala-modal');
            if (overlay) overlay.style.display = 'none';
            const modalClose = document.querySelector('.modal-close, .close, [data-dismiss="modal"], .intershala-close');
            if (modalClose) modalClose.click();
        });
        await delay(1500);
    }
    if (overlayCount >= 5) console.log('Max overlay attempts reached, proceeding anyway');
};

// Helper function to perform login
const performLogin = async (page, email, password, headless = true) => {
    await page.goto('https://internshala.com/login/user', { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('Current URL:', page.url());

    await page.mouse.move(500, 300, { steps: 10 });
    await delay(1000);

    console.log('Filling in email...');
    await page.type('#email', email, { delay: 100 });
    console.log('Filling in password...');
    await page.type('#password', password, { delay: 100 });

    console.log('Checking for reCAPTCHA...');
    const recaptchaCheckbox = await page.$('#recaptcha-anchor');
    const recaptchaInvisible = await page.evaluate(() => !!document.querySelector('.g-recaptcha[style*="visibility: hidden"]'));
    let cookies;
    if (recaptchaCheckbox) {
        console.log('reCAPTCHA checkbox found, clicking...');
        await recaptchaCheckbox.click();
        await delay(3000);

        const challengeVisible = await page.evaluate(() => {
            return !!document.querySelector('.recaptcha-challenge') || 
                   !!document.querySelector('iframe[src*="recaptcha/api2/bframe"]');
        });
        if (challengeVisible && headless) {
            console.log('reCAPTCHA challenge appeared - please solve manually');
            return { needsManualLogin: true };
        }
        console.log('No reCAPTCHA challenge appeared, proceeding with submission...');
    } else if (recaptchaInvisible) {
        console.log('Invisible reCAPTCHA detected, proceeding with submission...');
    } else {
        console.log('No reCAPTCHA checkbox or invisible reCAPTCHA found on the page');
    }

    console.log('Submitting login form...');
    const loginButton = await page.$('button[type="submit"]');
    const loginForm = await page.$('form');
    if (!loginButton || !loginForm) {
        throw new Error('Login form or submit button not found');
    }

    const navigationPromise = page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(async (err) => {
        console.log('Navigation timed out. Checking page state...');
        throw err;
    });

    await loginButton.click();
    await navigationPromise;

    const errorMessage = await page.evaluate(() => {
        const errorElement = document.querySelector('.error-message') || 
                            document.querySelector('.alert-danger') || 
                            document.querySelector('#error');
        return errorElement ? errorElement.textContent.trim() : null;
    });
    if (errorMessage) {
        throw new Error(`Login failed: ${errorMessage}`);
    }

    const isLoggedIn = await page.evaluate(() => !document.querySelector('#loginModal'));
    if (!isLoggedIn) {
        throw new Error('Login failed - please check credentials or page behavior');
    }

    cookies = await page.cookies();
    await fs.writeFile(cookiesFilePath, JSON.stringify(cookies, null, 2));
    console.log('Saved cookies for future use');
    return { success: true, cookies };
};

// Auto-apply function with internship/job differentiation
const autoApply = async (req, res) => {
    console.log('Received auto-apply request:', req.body);
    const { email, password, role, location, minStipend, duration, type, resumeFile } = req.body || {};
    const uploadedResume = req.file;

    if (!email || !password || !role || !type) {
        console.log('Validation failed: Email, password, role, or type missing');
        return res.status(400).json({ error: 'Email, password, role, and type (internship/job) are required' });
    }

    let browser;
    let page;
    try {
        let { browser: setupBrowser, page: setupPage } = await setupBrowserAndPage();
        browser = setupBrowser;
        page = setupPage;

        let cookiesExist = false;
        try {
            const cookies = JSON.parse(await fs.readFile(cookiesFilePath));
            await page.setCookie(...cookies);
            cookiesExist = true;
            console.log('Loaded cookies from file');
        } catch (error) {
            console.log('No cookies found, proceeding with login');
        }

        if (cookiesExist) {
            await page.goto('https://internshala.com/internships', { waitUntil: 'networkidle2', timeout: 60000 });
            const isLoggedIn = await page.evaluate(() => !document.querySelector('#loginModal'));
            if (!isLoggedIn) {
                console.log('Session expired, proceeding with login');
                cookiesExist = false;
            }
        }

        if (!cookiesExist) {
            const loginResult = await performLogin(page, email, password);
            if (loginResult.needsManualLogin) {
                await browser.close();
                browser = await puppeteer.launch({
                    headless: false,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                page = await browser.newPage();
                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
                await page.setViewport({ width: 1280, height: 720 });
                await page.goto('https://internshala.com/login/user', { waitUntil: 'networkidle2', timeout: 60000 });
                await page.type('#email', email, { delay: 100 });
                await page.type('#password', password, { delay: 100 });
                console.log('Please solve the reCAPTCHA manually and log in...');
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
                const cookies = await page.cookies();
                await fs.writeFile(cookiesFilePath, JSON.stringify(cookies, null, 2));
                console.log('Saved cookies for future use');
                await page.close();
                await browser.close();

                browser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                page = await browser.newPage();
                cookies = JSON.parse(await fs.readFile(cookiesFilePath));
                await page.setCookie(...cookies);
            }
        }

        const baseUrl = type === 'internship' ? 'https://internshala.com/internships' : 'https://internshala.com/jobs';
        await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        console.log(`Applying ${type} filters...`);

        await handleOverlays(page);

        // Apply filters with minimal delays
        try {
            await page.waitForSelector('#keywords', { timeout: 5000 });
            await page.type('#keywords', role, { delay: 50 });
            await page.keyboard.press('Enter');
            await page.waitForFunction(() => document.readyState === 'complete', { timeout: 2000 });
        } catch (error) {
            console.error('Failed to set keyword filter:', error.message);
        }

        if (location) {
            try {
                let locationInput = await page.waitForSelector('#location', { timeout: 5000 }).catch(() => null);
                if (!locationInput && location.toLowerCase() === 'remote') {
                    const remoteCheckbox = await page.waitForSelector('#remote_filter, #work_from_home, [data-remote="true"], label[for="remote"]', { timeout: 5000 }).catch(() => null);
                    if (remoteCheckbox) {
                        console.log('Remote filter found as a checkbox, clicking...');
                        await remoteCheckbox.click();
                        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 2000 });
                    }
                }
                if (locationInput) {
                    await locationInput.click({ clickCount: 3 });
                    await locationInput.type(location, { delay: 50 });
                    await page.keyboard.press('Enter');
                    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 2000 });
                }
            } catch (error) {
                console.error('Failed to set location filter:', error.message);
            }
        }

        if (minStipend) {
            try {
                let stipendInput = await page.waitForSelector('#stipend', { timeout: 5000 }).catch(() => null);
                if (stipendInput) {
                    await stipendInput.click({ clickCount: 3 });
                    await stipendInput.type(minStipend, { delay: 50 });
                    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 2000 });
                }
            } catch (error) {
                console.error('Failed to set stipend filter:', error.message);
            }
        }

        if (duration) {
            try {
                const durationMatch = duration.toLowerCase().match(/(\d+)\s*month/);
                if (durationMatch) {
                    let durationSelect = await page.waitForSelector('#duration', { timeout: 5000 }).catch(() => null);
                    if (durationSelect) {
                        await page.select('#duration', durationMatch[1]);
                        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 2000 });
                    }
                }
            } catch (error) {
                console.error('Failed to set duration filter:', error.message);
            }
        }

        try {
            let searchButton = await page.waitForSelector('#search_internships_button, #search_jobs_button', { timeout: 5000 }).catch(() => null);
            if (searchButton) {
                await page.evaluate((selector) => {
                    const button = document.querySelector(selector);
                    if (button) button.click();
                }, type === 'internship' ? '#search_internships_button' : '#search_jobs_button');
                await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5000 }); // Increased timeout
            }
        } catch (error) {
            console.error('Failed to click search button:', error.message);
        }

        await page.waitForSelector(type === 'internship' ? '.internship_meta' : '.job_meta', { timeout: 10000 }).catch(() => {
            console.log(`${type} listings not found within timeout`);
        });

        const cardSelector = type === 'internship' ? '.internship_meta' : '.job_meta';
        const opportunityCards = await page.$$(cardSelector);
        console.log(`Found ${opportunityCards.length} ${type} listings`);
        if (opportunityCards.length === 0) {
            throw new Error(`No ${type}s found matching the criteria`);
        }

        // Get all apply buttons and match details with fallback
        const opportunities = await Promise.all(opportunityCards.map(async (card, index) => {
            const cardHtml = await page.evaluate(el => el ? el.outerHTML : '', card).catch(() => '');
            const title = await card.$eval('.job-title, .internship_title, h3, .heading_4', el => el.textContent.trim()).catch(() => 'Unknown Title');
            const loc = await card.$eval('.location, .internship_location, .location_link', el => el.textContent.trim()).catch(() => '');
            const stipend = await card.$eval('.stipend, .internship_stipend, .stipend_container', el => el.textContent.trim().replace(/[^\d]/g, '')).catch(() => '0');
            const dur = await card.$eval('.duration, .internship_duration, .duration_text', el => el.textContent.trim()).catch(() => '');
            const applyButton = await card.waitForSelector('a.view_detail_button, button.view_detail_button, a.internship_apply_button, button.internship_apply_button, [data-href*="/apply"], .btn-apply, .apply-now, a.btn, .btn-primary, .apply-button', { timeout: 5000 }).catch(() => null);
            console.log(`${type} ${index} HTML snippet:`, cardHtml.substring(0, 200));
            return { index, card, title, loc, stipend, dur, applyButton, score: 0 };
        }));

        // Score opportunities for perfect match
        opportunities.forEach(op => {
            let score = 0;
            if (op.title.toLowerCase().includes(role.toLowerCase())) score += 30;
            if (location && op.loc.toLowerCase().includes(location.toLowerCase())) score += 30;
            if (minStipend && parseInt(op.stipend) >= parseInt(minStipend)) score += 20;
            if (duration && op.dur.toLowerCase().includes(duration.toLowerCase())) score += 20;
            op.score = score;
        });

        // Sort by score and take top 5
        const topOpportunities = opportunities.sort((a, b) => b.score - a.score).slice(0, 5);

        // Track application statuses
        const applicationStatuses = [];

        for (const { index, card, applyButton } of topOpportunities) {
            try {
                await handleOverlays(page);
                console.log(`Processing ${type} ${index} of ${opportunities.length} (Top 5 match)`);
                if (applyButton) {
                    console.log(`Apply Now button found for ${type} ${index}, checking visibility...`);
                    const buttonVisible = await page.evaluate((el) => {
                        const style = window.getComputedStyle(el);
                        return style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                    }, applyButton);
                    if (buttonVisible) {
                        console.log(`Apply button is visible, clicking for ${type} ${index}...`);
                        await applyButton.click({ delay: 100 });
                        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5000 });

                        const newUrl = page.url();
                        if (newUrl.includes('/apply/')) {
                            console.log(`Redirected to ${type} application page:`, newUrl);
                            await handleOverlays(page);
                            const applyForm = await page.$('form.apply-form, form#apply-form, .apply-form');
                            if (applyForm) {
                                console.log(`${type} application form detected, submitting...`);
                                applicationStatuses.push({ index, status: 'In Progress' });
                                if (uploadedResume) {
                                    const fileInput = await applyForm.$('input[type="file"]');
                                    if (fileInput) {
                                        await fileInput.uploadFile(uploadedResume.path);
                                        console.log('Resume uploaded');
                                    }
                                }
                                const submitButton = await applyForm.$('button[type="submit"], .apply-now-submit, .btn-submit, .intershala-submit');
                                if (submitButton) {
                                    await submitButton.click();
                                    await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5000 });
                                    console.log(`${type} application submitted for ${index}`);
                                    applicationStatuses[applicationStatuses.findIndex(s => s.index === index)] = { index, status: 'Applied' };
                                } else {
                                    console.log('No submit button found in application form');
                                    applicationStatuses[applicationStatuses.findIndex(s => s.index === index)] = { index, status: 'Form detected, but not submitted' };
                                }
                            } else {
                                console.log('No application form detected on apply page');
                                applicationStatuses.push({ index, status: 'Redirected, but no form' });
                            }
                        } else {
                            console.log('No redirect to apply page, assuming single-click apply');
                            applicationStatuses.push({ index, status: 'Single-click applied' });
                        }
                    } else {
                        console.log('Apply button not visible, skipping...');
                        applicationStatuses.push({ index, status: 'Button not visible' });
                    }
                } else {
                    console.log(`Apply Now button not found for ${type} ${index}, capturing full card context...`);
                    const fullCardHtml = await page.evaluate(el => el ? el.outerHTML : '', card).catch(() => '');
                    console.log(`Full card HTML for ${index}:`, fullCardHtml.substring(0, 500));
                    applicationStatuses.push({ index, status: 'No button found' });
                }
            } catch (error) {
                console.error(`Error applying to ${type} ${index}:`, error.message);
                applicationStatuses.push({ index, status: `Error: ${error.message}` });
            }
        }

        // Summary of application statuses for all opportunities
        const statusSummary = opportunities.reduce((summary, { index, applyButton }) => {
            const status = applyButton && topOpportunities.some(ti => ti.index === index) ? 'Not Applied (Top 5 only)' : 'Not Applied';
            summary[status] = (summary[status] || 0) + 1;
            if (applicationStatuses.some(s => s.index === index)) {
                const appliedStatus = applicationStatuses.find(s => s.index === index).status;
                summary[appliedStatus] = (summary[appliedStatus] || 0) + 1;
            }
            return summary;
        }, {});

        console.log(`\n=== ${type.toUpperCase()} Application Summary ===`);
        console.log(`Total ${type}s matched: ${opportunities.length}`);
        for (const [status, count] of Object.entries(statusSummary)) {
            console.log(`${status}: ${count}`);
        }
        console.log('================================\n');

        res.status(200).json({
            message: `Auto-apply for ${type}s completed successfully`,
            totalMatched: opportunities.length,
            statuses: applicationStatuses,
            summary: statusSummary
        });
    } catch (error) {
        console.error(`Auto-apply ${type} error:`, error.message);
        res.status(500).json({ error: error.message });
    } finally {
        if (browser) await browser.close();
    }
};

// Auto-login function
const autoLogin = async (req, res) => {
    console.log('Received auto-login request:', req.body);
    const { email, password } = req.body || {};

    if (!email || !password) {
        console.log('Validation failed: Email or password missing');
        return res.status(400).json({ error: 'Email and password are required' });
    }

    let browser;
    let page;
    try {
        let { browser: setupBrowser, page: setupPage } = await setupBrowserAndPage(false);
        browser = setupBrowser;
        page = setupPage;

        const loginResult = await performLogin(page, email, password, false);
        if (loginResult.needsManualLogin) {
            console.log('Please solve the reCAPTCHA manually and log in...');
            await page.waitForNavigation({ timeout: 60000 }).catch(() => {
                console.log('Manual login completed or timeout');
            });
            const cookies = await page.cookies();
            await fs.writeFile(cookiesFilePath, JSON.stringify(cookies, null, 2));
            console.log('Saved cookies for future use');
        }

        res.status(200).json({ message: 'Login successful, browser is open for you to see' });
    } catch (error) {
        console.error('Auto-login error:', error.message);
        res.status(500).json({ error: error.message });
    }
    // Do not close the browser to allow the user to see it
};

module.exports = { autoApply, autoLogin };