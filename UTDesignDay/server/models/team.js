const mongoose = require("mongoose");

const teamSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name of team is required"],
        trim: true,
    },
    location: {
        type: String,
        required: [true, "Location is required"],
        trim: true,
    },
    description: { type: String, required: [true, "Description is required"] },
    image: { type: String, required: [true, "Image of team is required"] },
    students: [{ type: String, required: [true, "Students name is required"] }], // Array of student names

    // Voting & favoriting
    // voteCount: { type: Number, default: 0 }, // Track votes

    startTime: {
        type: String,
        required: [true, "Start time is required"],
        trim: true,
    },
    endTime: {
        type: String,
        required: [true, "End time is required"],
        trim: true,
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
});

const Team = mongoose.model("Team", teamSchema);

module.exports = {
    Team: Team,
};
