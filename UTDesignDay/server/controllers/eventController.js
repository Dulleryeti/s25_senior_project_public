const { Event } = require("../models/event");
const { Team } = require("../models/team");
const { Vote } = require("../models/vote");
const { Scan } = require("../models/scan");
const mongoose = require("mongoose");
const {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
// const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// if a iOS user uploads an image use this
const heicConvert = require("heic-convert");

const sharp = require("sharp");
const dotenv = require("dotenv");
dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME;
const bucketRegion = process.env.AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// configure AWS S3
const s3 = new S3Client({
    region: bucketRegion,
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
});

class eventAPI {
    // get events
    static async getEvents(req, res) {
        try {
            const events = await Event.find().populate("teams");
            res.status(200).json({ events });
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch events" });
        }
    }

    // get a specific event, and details of event
    static async getEvent(req, res) {
        try {
            const event = await Event.findById(req.params.eventId).populate(
                "teams"
            );
            if (!event)
                return res.status(404).json({ message: "Event not found" });

            res.status(200).json(event);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch event details" });
        }
    }

    // get all teams from event
    static async getEventTeams(req, res) {
        try {
            const teams = await Team.find({ event: req.params.eventId });
            res.status(200).json({ teams });
        } catch (error) {
            res.status(500).json({
                error: "Failed to fetch teams for this event",
            });
        }
    }

    // get specific team from event
    static async getEventTeam(req, res) {
        try {
            const team = await Team.findOne({
                _id: req.params.teamId,
                event: req.params.eventId,
            });
            if (!team)
                return res
                    .status(404)
                    .json({ message: "Team not found in this event" });

            res.status(200).json(team);
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch team details" });
        }
    }

    // get random events (featured events)
    static async getRandomEvents(req, res) {
        try {
            const numEvents = parseInt(req.query.count) || 6;
            const randomEvents = await Event.aggregate([
                { $sample: { size: numEvents } },
            ]);

            res.status(200).json({ events: randomEvents });
        } catch (error) {
            res.status(500).json({ error: "Failed to fetch random events" });
        }
    }
    // for admins only

    // create event
    static async createEvent(req, res) {
        try {
            if (!req.file) {
                return res
                    .status(400)
                    .json({ error: "Image file is required" });
            }

            // check if the image is a supported type
            const supportedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/heic",
                "image/heif",
            ];
            if (!supportedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({
                    error: "Unsupported file type. Only JPG, PNG, and HEIC are allowed.",
                });
            }

            // check if the image is too large
            if (req.file.size > 10 * 1024 * 1024) {
                return res
                    .status(400)
                    .json({
                        error: "Image file too large. Maximum size is 10MB.",
                    });
            }

            const imageKey = `events/${Date.now()}_${req.file.originalname}`;

            // compress image to 1200px width and 75% quality for jpeg, 80% for png
            let compressedBuffer;
            let contentType = "image/jpeg";

            if (
                req.file.mimetype === "image/heic" ||
                req.file.mimetype === "image/heif"
            ) {
                const convertedBuffer = await heicConvert({
                    buffer: req.file.buffer,
                    format: "JPEG",
                    quality: 1,
                });

                compressedBuffer = await sharp(convertedBuffer)
                    .resize({ width: 1200 })
                    .jpeg({ quality: 75 })
                    .toBuffer();

                contentType = "image/jpeg";
            } else if (req.file.mimetype === "image/png") {
                compressedBuffer = await sharp(req.file.buffer)
                    .resize({ width: 1200 })
                    .png({ quality: 80 })
                    .toBuffer();

                contentType = "image/png";
            } else {
                compressedBuffer = await sharp(req.file.buffer)
                    .resize({ width: 1200 })
                    .jpeg({ quality: 75 })
                    .toBuffer();

                contentType = "image/jpeg";
            }

            const uploadParams = {
                Bucket: bucketName,
                Key: imageKey,
                Body: compressedBuffer,
                ContentType: contentType,
            };

            // upload image to S3
            await s3.send(new PutObjectCommand(uploadParams));

            const imageUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${imageKey}`;

            const newEvent = new Event({ ...req.body, image: imageUrl });
            await newEvent.save();

            // add eventURL for deeplinking to work.
            const eventURL = `utdesignday://event/${newEvent._id}`;
            newEvent.eventURL = eventURL;
            await newEvent.save();

            req.io.emit("eventCreated", newEvent);

            res.status(201).json({
                message: "Event created successfully",
                event: newEvent,
            });
        } catch (error) {
            res.status(500).json({ error: "Failed to create event" });
        }
    }

    // edit event
    static async editEvent(req, res) {
        try {
            let imageUrl = req.body.image;
            let oldImageKey = null;

            // find the existing event to get the old image URL
            const existingEvent = await Event.findById(req.params.eventId);
            if (!existingEvent)
                return res.status(404).json({ message: "Event not found" });

            if (req.file) {
                // check if the image is too large
                if (req.file.size > 10 * 1024 * 1024) {
                    return res
                        .status(400)
                        .json({
                            error: "Image file too large. Maximum size is 10MB.",
                        });
                }

                // check if the image is a supported type
                const supportedTypes = [
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                    "image/heic",
                    "image/heif",
                ];
                if (!supportedTypes.includes(req.file.mimetype)) {
                    return res.status(400).json({
                        error: "Unsupported file type. Only JPG, PNG, and HEIC are allowed.",
                    });
                }
                oldImageKey = existingEvent.image
                    ? existingEvent.image.split(".com/")[1]
                    : null;

                const imageKey = `events/${Date.now()}_${
                    req.file.originalname
                }`;
                // compress image to 1200px width and 75% quality for jpeg, 80% for png
                let compressedBuffer;
                let contentType = "image/jpeg";

                // check if the image is heic or heif and convert to jpeg
                if (
                    req.file.mimetype === "image/heic" ||
                    req.file.mimetype === "image/heif"
                ) {
                    const convertedBuffer = await heicConvert({
                        buffer: req.file.buffer,
                        format: "JPEG",
                        quality: 1,
                    });

                    compressedBuffer = await sharp(convertedBuffer)
                        .resize({ width: 1200 })
                        .jpeg({ quality: 75 })
                        .toBuffer();

                    contentType = "image/jpeg";
                } else if (req.file.mimetype === "image/png") {
                    compressedBuffer = await sharp(req.file.buffer)
                        .resize({ width: 1200 })
                        .png({ quality: 80 })
                        .toBuffer();

                    contentType = "image/png";
                } else {
                    compressedBuffer = await sharp(req.file.buffer)
                        .resize({ width: 1200 })
                        .jpeg({ quality: 75 })
                        .toBuffer();

                    contentType = "image/jpeg";
                }

                const uploadParams = {
                    Bucket: bucketName,
                    Key: imageKey,
                    Body: compressedBuffer,
                    ContentType: contentType,
                };

                await s3.send(new PutObjectCommand(uploadParams));
                imageUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${imageKey}`;

                if (oldImageKey) {
                    await s3.send(
                        new DeleteObjectCommand({
                            Bucket: bucketName,
                            Key: oldImageKey,
                        })
                    );
                }
            }

            const updatedEvent = await Event.findByIdAndUpdate(
                req.params.eventId,
                { ...req.body, image: imageUrl },
                { new: true }
            );

            req.io.emit("Event updated", updatedEvent);

            res.status(200).json({
                message: "Event updated successfully",
                event: updatedEvent,
            });
        } catch (error) {
            console.error("Edit Event Server Error:", error);
            res.status(500).json({ error: "Failed to update event" });
        }
    }

    // remove event
    static async deleteEvent(req, res) {
        try {
            const event = await Event.findById(req.params.eventId);
            if (!event)
                return res.status(404).json({ message: "Event not found" });

            const teams = await Team.find({ event: req.params.eventId });

            // delete each team's image from S3
            for (const team of teams) {
                if (team.image) {
                    const teamImageKey = team.image.split(".com/")[1];
                    await s3.send(
                        new DeleteObjectCommand({
                            Bucket: bucketName,
                            Key: teamImageKey,
                        })
                    );
                }
            }

            const imageKey = event.image ? event.image.split(".com/")[1] : null;

            if (imageKey) {
                await s3.send(
                    new DeleteObjectCommand({
                        Bucket: bucketName,
                        Key: imageKey,
                    })
                );
            }
            // delete teams
            await Team.deleteMany({ event: req.params.eventId });

            // delete all votes
            await Vote.deleteMany({ event: req.params.eventId });

            // delete all scans
            await Scan.deleteMany({ event: req.params.eventId });

            await Event.findByIdAndDelete(req.params.eventId);

            req.io.emit("eventDeleted", { eventId: req.params.eventId });

            res.status(200).json({
                message: "Event and associated teams deleted successfully",
            });
        } catch (error) {
            console.error("Delete Event Server Error:", error);
            res.status(500).json({ error: "Failed to delete event" });
        }
    }

    // create team
    static async createTeam(req, res) {
        try {
            let imageUrl = "";
            let students = req.body.students;
            // make students an araay of students
            if (typeof students === "string") {
                students = JSON.parse(students);
            }

            const event = await Event.findById(req.params.eventId);
            if (!event)
                return res.status(404).json({ message: "Event not found" });

            if (event.eventType !== "Activity") {
                return res
                    .status(400)
                    .json({
                        error: "Teams can only be added to Activity events",
                    });
            }

            if (!req.file) {
                return res
                    .status(400)
                    .json({ error: "Image file is required" });
            }

            // check if the image is too large
            if (req.file.size > 10 * 1024 * 1024) {
                return res
                    .status(400)
                    .json({
                        error: "Image file too large. Maximum size is 10MB.",
                    });
            }

            // check if the image is a supported type
            const supportedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/heic",
                "image/heif",
            ];
            if (!supportedTypes.includes(req.file.mimetype)) {
                return res.status(400).json({
                    error: "Unsupported file type. Only JPG, PNG, and HEIC are allowed.",
                });
            }

            const imageKey = `teams/${Date.now()}_${req.file.originalname}`;

            // compress image to 1200px width and 75% quality for jpeg, 80% for png
            let compressedBuffer;
            let contentType = "image/jpeg";

            // check if the image is heic or heif and convert to jpeg
            if (
                req.file.mimetype === "image/heic" ||
                req.file.mimetype === "image/heif"
            ) {
                const convertedBuffer = await heicConvert({
                    buffer: req.file.buffer,
                    format: "JPEG",
                    quality: 1,
                });

                compressedBuffer = await sharp(convertedBuffer)
                    .resize({ width: 1200 })
                    .jpeg({ quality: 75 })
                    .toBuffer();

                contentType = "image/jpeg";
            } else if (req.file.mimetype === "image/png") {
                compressedBuffer = await sharp(req.file.buffer)
                    .resize({ width: 1200 })
                    .png({ quality: 80 })
                    .toBuffer();

                contentType = "image/png";
            } else {
                compressedBuffer = await sharp(req.file.buffer)
                    .resize({ width: 1200 })
                    .jpeg({ quality: 75 })
                    .toBuffer();

                contentType = "image/jpeg";
            }

            const uploadParams = {
                Bucket: bucketName,
                Key: imageKey,
                Body: compressedBuffer,
                ContentType: contentType,
            };

            await s3.send(new PutObjectCommand(uploadParams));

            imageUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${imageKey}`;

            const newTeam = new Team({
                ...req.body,
                image: imageUrl,
                event: req.params.eventId,
                students,
            });
            await newTeam.save();

            req.io.emit("teamCreated", newTeam);
            await Event.findByIdAndUpdate(req.params.eventId, {
                $push: { teams: newTeam._id },
            });

            res.status(201).json({
                message: "Team created successfully",
                team: newTeam,
            });
        } catch (error) {
            console.error("Create Team Server Error:", error);
            res.status(500).json({ error: "Failed to create team" });
        }
    }

    // edit team
    static async editTeam(req, res) {
        try {
            let imageUrl = req.body.image;
            let oldImageKey = null;
            let students = req.body.students;
            if (typeof students === "string") {
                students = JSON.parse(students);
            }
            req.body.students = students;

            // console.log('Editing event:', req.params.eventId);

            // find the existing team to get the old image URL (if it exists)
            const existingTeam = await Team.findById(req.params.teamId);
            if (!existingTeam)
                return res.status(404).json({ message: "Team not found" });

            if (req.file) {
                // check if the image is too large
                if (req.file.size > 10 * 1024 * 1024) {
                    return res
                        .status(400)
                        .json({
                            error: "Image file too large. Maximum size is 10MB.",
                        });
                }

                // check if the image is a supported type
                const supportedTypes = [
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                    "image/heic",
                    "image/heif",
                ];
                if (!supportedTypes.includes(req.file.mimetype)) {
                    return res.status(400).json({
                        error: "Unsupported file type. Only JPG, PNG, and HEIC are allowed.",
                    });
                }

                oldImageKey = existingTeam.image
                    ? existingTeam.image.split(".com/")[1]
                    : null;

                const imageKey = `teams/${Date.now()}_${req.file.originalname}`;

                // compress image to 1200px width and 75% quality for jpeg, 80% for png
                let compressedBuffer;
                let contentType = "image/jpeg";

                // check if the image is heic or heif and convert to jpeg
                if (
                    req.file.mimetype === "image/heic" ||
                    req.file.mimetype === "image/heif"
                ) {
                    const convertedBuffer = await heicConvert({
                        buffer: req.file.buffer,
                        format: "JPEG",
                        quality: 1,
                    });

                    compressedBuffer = await sharp(convertedBuffer)
                        .resize({ width: 1200 })
                        .jpeg({ quality: 75 })
                        .toBuffer();

                    contentType = "image/jpeg";
                } else if (req.file.mimetype === "image/png") {
                    compressedBuffer = await sharp(req.file.buffer)
                        .resize({ width: 1200 })
                        .png({ quality: 80 })
                        .toBuffer();

                    contentType = "image/png";
                } else {
                    compressedBuffer = await sharp(req.file.buffer)
                        .resize({ width: 1200 })
                        .jpeg({ quality: 75 })
                        .toBuffer();

                    contentType = "image/jpeg";
                }

                const uploadParams = {
                    Bucket: bucketName,
                    Key: imageKey,
                    Body: compressedBuffer,
                    ContentType: contentType,
                };

                await s3.send(new PutObjectCommand(uploadParams));
                imageUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${imageKey}`;

                // delete old image from S3
                if (oldImageKey) {
                    await s3.send(
                        new DeleteObjectCommand({
                            Bucket: bucketName,
                            Key: oldImageKey,
                        })
                    );
                }
            }

            const updatedTeam = await Team.findByIdAndUpdate(
                req.params.teamId,
                { ...req.body, image: imageUrl },
                { new: true }
            );

            req.io.emit("teamUpdated", updatedTeam);

            res.status(200).json({
                message: "Team updated successfully",
                team: updatedTeam,
            });
        } catch (error) {
            console.error("Edit Team Server Error:", error);
            res.status(500).json({ error: "Failed to update team" });
        }
    }

    // remove team
    static async deleteTeam(req, res) {
        try {
            const team = await Team.findById(req.params.teamId);
            if (!team)
                return res.status(404).json({ message: "Team not found" });

            const imageKey = team.image ? team.image.split(".com/")[1] : null;

            if (imageKey) {
                await s3.send(
                    new DeleteObjectCommand({
                        Bucket: bucketName,
                        Key: imageKey,
                    })
                );
            }

            await Vote.deleteMany({ team: req.params.teamId });
            await Team.findByIdAndDelete(req.params.teamId);

            req.io.emit("teamDeleted", {
                teamId: req.params.teamId,
                eventId: req.params.eventId,
            });

            await Event.findByIdAndUpdate(req.params.eventId, {
                $pull: { teams: req.params.teamId },
            });

            res.status(200).json({ message: "Team deleted successfully" });
        } catch (error) {
            console.error("Delete Team Server Error:", error);
            res.status(500).json({ error: "Failed to delete team" });
        }
    }
}

module.exports = eventAPI;
