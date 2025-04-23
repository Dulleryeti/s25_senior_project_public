const express = require("express");
const router = express.Router();
const guestAPI = require("../controllers/guestController");

// testing purposes only
// router.get("/guests", guestAPI.getGuests);

// router.get('/guests/:guestId/scans', guestAPI.getScans);

// this is how I track the scans for guests
router.get("/guests/:guestId/events-scans", guestAPI.getEventsScanStatus);

// this is how guests post a scan
router.post("/guests/:guestId/scans", guestAPI.scanEvent);

router.get("/guests/:guestId/votes", guestAPI.getVotes);

// this is how guests post a vote
router.post("/guests/:guestId/votes", guestAPI.postVotes);

// tesing purposes only
// router.delete('/guests/:guestId/votes/:eventId', guestAPI.removeVote);

module.exports = router;
