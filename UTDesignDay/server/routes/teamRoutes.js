const express = require("express");
const router = express.Router();
const teamAPI = require("../controllers/teamController");

// get random teams from events (teams for you)
router.get("/teams/random", teamAPI.getRandomTeams);

router.get("/teams/:teamId", teamAPI.getTeam);

module.exports = router;
