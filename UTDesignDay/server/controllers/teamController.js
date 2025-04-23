const { Team } = require("../models/team");

class teamAPI {
    // get random teams for teams for you section
    static async getRandomTeams(req, res) {
        try {
            const numTeams = parseInt(req.query.count) || 12;

            const randomTeams = await Team.aggregate([
                { $sample: { size: numTeams } },
            ]);

            const populatedTeams = await Team.populate(randomTeams, {
                path: "event",
                select: "_id name",
            });

            res.status(200).json({ teams: populatedTeams });
        } catch (error) {
            console.error("Error fetching random teams:", error);
            res.status(500).json({ error: "Failed to fetch random teams" });
        }
    }

    // get team
    static async getTeam(req, res) {
        try {
            const team = await Team.findById(req.params.teamId).populate(
                "event"
            );
            if (!team)
                return res.status(404).json({ message: "Team not found" });

            res.status(200).json(team);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch team details" });
        }
    }
}

module.exports = teamAPI;
