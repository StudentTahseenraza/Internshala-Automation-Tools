const express = require('express');
const router = express.Router();
const coverLetterController = require('../controllers/coverLetterController');
const resumeController = require('../controllers/resumeController');
const skillMatchController = require('../controllers/skillMatchController');
const recommendationController = require('../controllers/recommendationController');
const alertController = require('../controllers/alertController');
const autoApplyController = require('../controllers/autoApplyController');
const { fetchJobsFromMultiplePlatforms } = require('../controllers/multiPlatformController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/cover-letter', coverLetterController.generateCoverLetter);
router.post('/resume-optimize', resumeController.optimizeResume);
router.post('/skill-match', skillMatchController.analyzeSkills);
router.post('/recommend-internships', upload.single('resume'), recommendationController.recommendInternships);
router.post('/alerts', alertController.setAlerts);
router.post('/auto-apply', autoApplyController.autoApply);
router.post('/auto-login', autoApplyController.autoLogin);
router.post('/jobs', fetchJobsFromMultiplePlatforms);
router.get('/applications', (req, res) => res.redirect('/api/fetch-applications'));

module.exports = router;