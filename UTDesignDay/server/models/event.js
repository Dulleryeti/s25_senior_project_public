const mongoose = require("mongoose");

const eventSchema = mongoose.Schema({
    name: { type: String, required: [true, "Name is required"], trim: true },
    location: {
        type: String,
        required: [true, "Location is required"],
        trim: true,
    },
    image: { type: String, required: [true, "Image is required"] },
    description: { type: String, required: [true, "Description is required"] },

    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],

    startTime: {
        type: String,
        required: [true, "Start time is required"],
        trim: true,
    },
    endTime: {
        type: String,
        required: function () {
            return this.eventType !== "Show"; // required only if it's not a show
        },
        trim: true,
    },
    duration: {
        type: Number,
        required: function () {
            return this.eventType === "Show"; // required only if it's a show
        },
    },

    eventType: {
        type: String,
        enum: ["Activity", "Show", "Exhibit"],
        required: [true, "Event type is required"],
    },

    // scannedCount: { type: Number, default: 0 },

    // isScanned: { type: Boolean, default: false },
    // this should help with deeplinking
    eventURL: { type: String },
});

const Event = mongoose.model("Event", eventSchema);

module.exports = {
    Event: Event,
};
