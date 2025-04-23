const { Vote } = require("../models/vote");
const { Scan } = require("../models/scan");
const { Event } = require("../models/event");

class guestAPI {
    // static async getGuests(req, res) {
    //     try {
    //         const voteGuests = await Vote.distinct("guestId");
    //         const scanGuests = await Scan.distinct("guestId");

    //         const allGuests = Array.from(new Set([...voteGuests, ...scanGuests]));

    //         res.status(200).json({ totalGuests: allGuests.length, guests: allGuests });
    //     } catch (error) {
    //         res.status(500).json({ error: "Failed to fetch guests" });
    //     }
    // }
    static async getVotes(req, res) {
        try {
            const { guestId } = req.params;
            const votes = await Vote.find({ guestId }).populate("event team");
            res.status(200).json({ votes });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch votes" });
        }
    }

    static async postVotes(req, res) {
        try {
            const { guestId } = req.params;
            const { eventId, teamId } = req.body;

            console.log("Guest trying to vote:", guestId);
            console.log("Event:", eventId, "Team:", teamId);

            const existingVote = await Vote.findOne({
                guestId,
                event: eventId,
            });
            console.log("Existing vote for this guest:", existingVote);

            if (existingVote)
                return res
                    .status(400)
                    .json({ message: "Guest already voted for this event" });

            const newVote = new Vote({ guestId, event: eventId, team: teamId });
            await newVote.save();

            req.io.emit("guestVoted", newVote);
            console.log("guest voted!");

            res.status(201).json({ message: "Vote recorded", newVote });
        } catch (error) {
            console.log("Vote error:", error);
            res.status(500).json({ error: "Failed to cast vote" });
        }
    }

    // Get scans
    // static async getScans(req, res) {
    //     try {
    //         const { guestId } = req.params;

    //         const scans = await Scan.find({ guestId }).populate('event');
    //         res.status(200).json({ scans });
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ error: "Failed to fetch scans" });
    //     }
    // }

    static async getEventsScanStatus(req, res) {
        try {
            const { guestId } = req.params;

            const events = await Event.find();

            const scans = await Scan.find({ guestId });
            const scannedEventIds = scans.map((scan) => scan.event.toString());

            // Mark each event as scanned or not
            const annotatedEvents = events.map((event) => ({
                ...event.toObject(),
                scanned: scannedEventIds.includes(event._id.toString()),
            }));

            res.status(200).json({ events: annotatedEvents });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Failed to load events with scan status",
            });
        }
    }

    // Scan an event
    static async scanEvent(req, res) {
        try {
            const { guestId } = req.params;
            const { eventId } = req.body;

            const newScan = new Scan({ guestId, event: eventId });
            await newScan.save();

            req.io.emit("guestScanned", newScan);
            console.log("Guest scanned an event!");

            res.status(201).json({ message: "Event scanned", newScan });
        } catch (error) {
            // check for duplcate scan error
            if (error.code === 11000) {
                return res
                    .status(409)
                    .json({
                        message: "Event already scanned by guest",
                        alreadyScanned: true,
                    });
            }

            console.error("❌ Error scanning event:", error);
            res.status(500).json({ error: "Failed to scan event" });
        }
    }

    // remove guest vote
    // static async removeVote(req, res) {
    //     try {
    //         const { guestId, eventId } = req.params;

    //         const result = await Vote.deleteOne({ guestId, event: eventId });
    //         if (result.deletedCount === 0) {
    //             return res.status(404).json({ message: "Vote not found" });
    //         }

    //         res.status(200).json({ message: "Vote removed" });
    //     } catch (error) {
    //         res.status(500).json({ error: "Failed to remove vote" });
    //     }
    // }

    // remove guest scan
    // static async removeScan(req, res) {
    //     try {
    //         const { guestId, eventId } = req.params;

    //         const result = await Scan.deleteOne({ guestId, event: eventId });
    //         if (result.deletedCount === 0) {
    //             return res.status(404).json({ message: "Scan not found" });
    //         }

    //         res.status(200).json({ message: "Scan removed" });
    //     } catch (error) {
    //         res.status(500).json({ error: "Failed to remove scan" });
    //     }
    // }
}

module.exports = guestAPI;
