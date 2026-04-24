const express = require('express');
const router = express.Router();
const researchAuth = require('../auth/research_auth.js');
const ResearchController = require('../controllers/research_controller.js');

router.use(researchAuth);

router.get('/health-trends',    ResearchController.healthTrends);
router.get('/nutrition-trends', ResearchController.nutritionTrends);
router.get('/food-patterns',    ResearchController.foodPatterns);
router.get('/population-stats', ResearchController.populationStats);

module.exports = router;
