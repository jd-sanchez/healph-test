const express = require("express");
const router = express.Router();
const RankingController = require('../controllers/rankings_controller');
const Auth = require('../auth/auth_token_handler.js');

router.get("/daily", RankingController.dailyRankings);
router.get("/weekly", RankingController.weeklyRankings);
router.get("/monthly", RankingController.monthlyRankings);
router.get("/challenge-stats", RankingController.challengeStats);

module.exports = router;