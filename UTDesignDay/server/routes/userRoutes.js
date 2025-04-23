const express = require("express");
const router = express.Router();
const userAPI = require("../controllers/userController");
const { verifyToken, requireRole } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

// rate limiting middleware for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // max 5 attempts per IP
    message: {
        message: "Too many login attempts. Please try again in 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// for users and admins

// guests can only view events and teams. They cannot vote, favorite, or scan events.

// to be able to access scanning, favoriting, and voting a user must be logged in.

// login
router.post("/session", loginLimiter, userAPI.loginUser);

// get user
router.get("/users/:id", userAPI.getUser);

// logout
router.delete("/session", userAPI.logoutUser);

// create user
router.post("/users", userAPI.registerUser);

// get users favorite teams, not for guests
// router.get('/users/:id/favorites', verifyToken, userAPI.getFavorites);

// ost users favorite teams, not for guests
// router.post('/users/:id/favorites', verifyToken, userAPI.addFavorite);

// do I need to delete favorites?
// router.delete('/users/:id/favorites', verifyToken, userAPI.removeFavorite);

// get scans, not for guests
// router.get('/users/:id/scans', userAPI.getScans);

// scan event, not for guests
// router.post('/users/:id/scans', userAPI.scanEvent);

// post users votes, not for gu4ests
// router.post('/users/:id/votes', userAPI.postVotes);

// only for admins

// get users
router.get("/users", verifyToken, requireRole(["admin"]), userAPI.getUsers);

// router.delete("/users/:id", verifyToken, requireRole(['admin']) ,userAPI.removeUser);

// search for user
// router.get('/users/search', userAPI.searchUsers);

// change role of user
router.patch(
    "/users/:id/role",
    verifyToken,
    requireRole(["admin"]),
    userAPI.editRole
);

// get votes total from all events
router.get(
    "/admins/votes/total",
    verifyToken,
    requireRole(["admin"]),
    userAPI.getAllVotesTotal
);

// get votes for teams from specific event// example get votes from teams for miniatronic golf from all users
router.get(
    "/admins/events/:eventId/votes",
    verifyToken,
    requireRole(["admin"]),
    userAPI.getVoteCountsForEvent
);

// router.get('/events/:eventId/votes', userAPI.getVoteCountsForEvent);

// get scanned events from all users
router.get(
    "/admins/events/scans",
    verifyToken,
    requireRole(["admin"]),
    userAPI.getScannedEventCounts
);

// router.get('/events/scans', userAPI.getScannedEventCounts);

module.exports = router;
