const mongoose = require("mongoose");

const voteSchema = mongoose.Schema({
    // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    guestId: { type: String, required: false },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
});

// prevent duplicate votes
voteSchema.index(
    { guestId: 1, event: 1 },
    { unique: true, partialFilterExpression: { guestId: { $exists: true } } }
);

const Vote = mongoose.model("Vote", voteSchema);

module.exports = {
    Vote,
};
