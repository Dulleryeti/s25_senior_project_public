const mongoose = require("mongoose");

const scanSchema = mongoose.Schema({
    // user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    guestId: { type: String, required: false },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    // scannedAt: { type: Date, default: Date.now }
});

// Prevent duplicate scans
scanSchema.index(
    { guestId: 1, event: 1 },
    { unique: true, partialFilterExpression: { guestId: { $exists: true } } }
);

const Scan = mongoose.model("Scan", scanSchema);

module.exports = {
    Scan,
};
