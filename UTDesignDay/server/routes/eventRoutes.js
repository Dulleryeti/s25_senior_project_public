const express = require("express");
const router = express.Router();
const eventAPI = require("../controllers/eventController");
const multer = require("multer");
const { verifyToken, requireRole } = require("../middleware/auth");

const upload = multer({
    storage: multer.memoryStorage(), // store files in memory for easy access
    limits: { fileSize: 10 * 1024 * 1024 }, // limit file size to 10MB, sharp should be able to compress images.
});

// detect if a file is too large for multer, then show it on frontend
function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res
                .status(400)
                .json({
                    error: "File too large. Maximum allowed size is 10MB.",
                });
        }

        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res
            .status(500)
            .json({ error: "An unknown error occurred during file upload." });
    }

    next();
}

// all users can view events

// get random events (featured events)
router.get("/events/random", eventAPI.getRandomEvents);

// get events
router.get("/events", eventAPI.getEvents);

// get specific event
router.get("/events/:eventId", eventAPI.getEvent);

// get events teams
router.get("/events/:eventId/teams", eventAPI.getEventTeams);

// get specific team from event
router.get("/events/:eventId/teams/:teamId", eventAPI.getEventTeam);

// search for events
// router.get('/events/search', eventAPI.searchEvents);

// only for admins

// post events
router.post(
    "/events",
    verifyToken,
    requireRole(["admin"]),
    upload.single("image"),
    handleMulterError,
    eventAPI.createEvent
);

// edit events
router.put(
    "/events/:eventId",
    verifyToken,
    requireRole(["admin"]),
    upload.single("image"),
    handleMulterError,
    eventAPI.editEvent
);

// remove events
router.delete(
    "/events/:eventId",
    verifyToken,
    requireRole(["admin"]),
    eventAPI.deleteEvent
);

// admin only create teams for event
router.post(
    "/events/:eventId/teams",
    verifyToken,
    requireRole(["admin"]),
    upload.single("image"),
    handleMulterError,
    eventAPI.createTeam
);

// admin only edit teams
router.put(
    "/events/:eventId/teams/:teamId",
    verifyToken,
    requireRole(["admin"]),
    upload.single("image"),
    handleMulterError,
    eventAPI.editTeam
);

// admin only delete teams from event
router.delete(
    "/events/:eventId/teams/:teamId",
    verifyToken,
    requireRole(["admin"]),
    eventAPI.deleteTeam
);

module.exports = router;
