const { User } = require("../models/user");
// const { Event } = require('../models/event');
// const { Team } = require('../models/team');
const { Vote } = require("../models/vote");
const { Scan } = require("../models/scan");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

dotenv.config();

class userAPI {
    static async getUser(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (user) {
                res.status(200).json(user);
            } else {
                res.sendStatus(404);
            }
        } catch (error) {
            console.error("Error fetching user by ID:", error);
            res.sendStatus(500); // Internal Server Error
        }
    }

    static async registerUser(req, res) {
        try {
            // ensure all required fields are provided
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res
                    .status(400)
                    .json({ error: "All fields are required" });
            }

            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: "Email is invalid" });
            }

            if (password.length < 6) {
                return res
                    .status(400)
                    .json({ error: "Password must be at least 6 characters" });
            }

            // check if user already exists before proceeding
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                console.log("User already exists");
                return res
                    .status(409)
                    .json({ error: "User with that email already exists!" }); // 409 Conflict
            }

            // Create a new user
            const newUser = new User({ name, email, role: "user" });

            // Hash password and save user
            await newUser.setEncryptedPassword(password);
            await newUser.save();

            req.io.emit("userCreated", newUser);

            console.log("New User Created");

            res.status(201).json({
                message: "User registered successfully",
                user: newUser,
            });
        } catch (error) {
            console.error("Error registering user:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    static async loginUser(req, res) {
        try {
            const { email, password } = req.body;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: "Email is invalid" });
            }

            if (password.length < 6) {
                return res
                    .status(400)
                    .json({ error: "Password must be at least 6 characters" });
            }
            const user = await User.findOne({ email: req.body.email });

            if (!user)
                return res
                    .status(401)
                    .json({ message: "Invalid email or password" });

            const isVerified = await user.verifyPassword(req.body.password);
            if (!isVerified)
                return res
                    .status(401)
                    .json({ message: "Invalid email or password" });

            // generate JWT Token
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "8h" }
            );

            console.log("Successfully logged in!");
            res.status(200).json({ token, user });
        } catch (error) {
            res.status(500).json({ error: "Login failed" });
        }
    }

    static async logoutUser(req, res) {
        console.log("Logged out!");
        res.status(200).json({
            message: "Logged out! Please clear token from client.",
        });
    }

    // static async getFavorites(req, res) {
    //     try {
    //         const user = await User.findById(req.params.id).populate('favoritedTeams', 'name location description');

    //         if (!user) {
    //             return res.status(404).json({ error: "User not found" });
    //         }

    //         res.json({ favorites: user.favoritedTeams });
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ error: "Error fetching favorite teams" });
    //     }
    // }

    // static async addFavorite(req, res) {
    //     try {
    //         const { id } = req.params; // User ID
    //         const { teamId } = req.body; // Team ID

    //         const user = await User.findById(id);
    //         if (!user) return res.status(404).json({ error: "User not found" });

    //         if (!user.favoritedTeams.includes(teamId)) {
    //             user.favoritedTeams.push(teamId);
    //             await user.save();
    //         }

    //         res.json({ message: "Team added to favorites", favoritedTeams: user.favoritedTeams });
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ error: "Error adding to favorites" });
    //     }
    // }

    // static async removeFavorite(req, res) {
    //     try {
    //         const { id } = req.params; // User ID
    //         const { teamId } = req.body; // Team ID

    //         const user = await User.findById(id);
    //         if (!user) return res.status(404).json({ error: "User not found" });

    //         user.favoritedTeams = user.favoritedTeams.filter(fav => fav.toString() !== teamId);
    //         await user.save();

    //         res.json({ message: "Team removed from favorites", favoritedTeams: user.favoritedTeams });
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ error: "Error removing from favorites" });
    //     }
    // }

    // Post a vote
    // static async postVotes(req, res) {
    //     try {
    //         const { id } = req.params;
    //         const { eventId, teamId } = req.body;

    //         const existingVote = await Vote.findOne({ user: id, event: eventId });
    //         if (existingVote) return res.status(400).json({ message: "User already voted for this event" });

    //         const vote = new Vote({ user: id, event: eventId, team: teamId });
    //         await vote.save();

    //         res.status(201).json({ message: "Vote recorded", vote });
    //     } catch (error) {
    //         res.status(500).json({ error: "Failed to cast vote" });
    //     }
    // }

    // Get user scans
    // static async getScans(req, res) {
    //     try {
    //         const user = await User.findById(req.params.id).populate('eventsScanned');
    //         if (!user) return res.status(404).json({ message: "User not found" });

    //         res.status(200).json({ scans: user.eventsScanned });
    //     } catch (error) {
    //         res.status(500).json({ error: "Failed to fetch scans" });
    //     }
    // }

    // Scan an event
    // static async scanEvent(req, res) {
    //     try {
    //         const { id } = req.params;
    //         const { eventId } = req.body;

    //         const user = await User.findById(id);
    //         if (!user) return res.status(404).json({ message: "User not found" });

    //         if (!user.eventsScanned.includes(eventId)) {
    //             user.eventsScanned.push(eventId);
    //             await user.save();
    //         }

    //         res.status(201).json({ message: "Event scanned", eventsScanned: user.eventsScanned });
    //     } catch (error) {
    //         res.status(500).json({ error: "Failed to scan event" });
    //     }
    // }

    // for admims only

    // static async removeUser(req, res) {
    //     try {

    //         const { id } = req.params;
    //         const user = await User.findByIdAndDelete(id);
    //         if (!user) return res.status(404).json({ message: "User not found" });

    //         res.status(204).json({ message: "User successfully deleted" });

    //     } catch {
    //         console.log("Error deleting user", error);
    //         res.staus(500).json({ error: "Failed to delete user" });
    //     }

    // }

    static async getUsers(req, res) {
        User.find().then((users) => {
            res.status(200).json({ users: users });
        });
    }

    // Change user role (Admin only)
    static async editRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            const updatedUser = await User.findByIdAndUpdate(
                id,
                { role },
                { new: true }
            );
            if (!updatedUser)
                return res.status(404).json({ message: "User not found" });

            req.io.emit("userRoleChanged", updatedUser);

            res.status(200).json({ message: "Role updated", updatedUser });
        } catch (error) {
            res.status(500).json({ error: "Failed to update role" });
        }
    }

    // Get vote totals from all events
    static async getAllVotesTotal(req, res) {
        try {
            const totalVotes = await Vote.countDocuments(); // counts ALL votes
            res.status(200).json({ totalVotes });
        } catch (error) {
            console.error("Error getting total vote count:", error);
            res.status(500).json({ error: "Failed to count all votes" });
        }
    }

    // this will be for admin analytics
    static async getVoteCountsForEvent(req, res) {
        try {
            const { eventId } = req.params;

            // Aggregate votes by team for this event
            const teamVotes = await Vote.aggregate([
                { $match: { event: new mongoose.Types.ObjectId(eventId) } },
                { $group: { _id: "$team", voteCount: { $sum: 1 } } },
                {
                    $lookup: {
                        from: "teams",
                        localField: "_id",
                        foreignField: "_id",
                        as: "teamData",
                    },
                },
                { $unwind: "$teamData" },
                { $project: { team: "$teamData.name", voteCount: 1 } },
            ]);

            // Calculate total votes
            const totalVotes = teamVotes.reduce(
                (sum, team) => sum + team.voteCount,
                0
            );

            res.status(200).json({
                eventId,
                totalVotes: totalVotes || 0,
                teamVotes: teamVotes || [],
            });
        } catch (error) {
            console.error("Vote count error:", error);

            res.status(500).json({ error: "Failed to fetch vote counts" });
        }
    }

    // this will be for admin analytics
    static async getScannedEventCounts(req, res) {
        try {
            // Aggregate the number of scans per event
            const eventScans = await Scan.aggregate([
                { $group: { _id: "$event", scanCount: { $sum: 1 } } },
                {
                    $lookup: {
                        from: "events",
                        localField: "_id",
                        foreignField: "_id",
                        as: "eventData",
                    },
                },
                { $unwind: "$eventData" },
                { $project: { event: "$eventData.name", scanCount: 1 } },
            ]);

            // Calculate total scans
            const totalScans = eventScans.reduce(
                (sum, event) => sum + event.scanCount,
                0
            );

            res.status(200).json({
                totalScans: totalScans || 0,
                eventScans: eventScans || [],
            });
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch scan counts" });
        }
    }
}

module.exports = userAPI;
