// this file contains integration tests for the guest routes

require("../setup");
const request = require("supertest");
const app = require("../../app");
const { Vote } = require("../../models/vote");
const { Scan } = require("../../models/scan");
const { Event } = require("../../models/event");
const mongoose = require("mongoose");

let guestId = "guest-abc-123";
let eventId;
let teamId;

jest.setTimeout(15000);

describe("Guest Routes – Integration Tests", () => {
    beforeAll(async () => {
        // create an event to mock scanning
        const event = await Event.create({
            name: "Guest Voting Event",
            location: "Guest Hall",
            description: "For guest voting and scanning",
            startTime: "11:00 AM",
            endTime: "12:00 PM",
            eventType: "Activity",
            image: "fixture_test.jpg",
        });
        eventId = event._id;

        // create a team to mock voting
        const team = await mongoose.model("Team").create({
            name: "Team Guest",
            location: "Booth A",
            description: "Team for guest test",
            image: "fixture_test.jpg",
            students: ["Alice"],
            voteCount: 0,
            startTime: "11:00 AM",
            endTime: "12:00 PM",
            event: eventId,
        });
        teamId = team._id;
    });

    it("should allow a guest to vote for a team", async () => {
        const res = await request(app)
            .post(`/guests/${guestId}/votes`)
            .send({ eventId, teamId });

        expect(res.status).toBe(201);
        expect(res.body.message).toMatch(/vote recorded/i);
    });

    it("should not allow duplicate guest votes for same event", async () => {
        const res = await request(app)
            .post(`/guests/${guestId}/votes`)
            .send({ eventId, teamId });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already voted/i);
    });

    it("should retrieve guest votes", async () => {
        const res = await request(app).get(`/guests/${guestId}/votes`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.votes)).toBe(true);
    });

    it("should allow a guest to scan an event", async () => {
        const res = await request(app)
            .post(`/guests/${guestId}/scans`)
            .send({ eventId });

        expect(res.status).toBe(201);
        expect(res.body.message).toMatch(/event scanned/i);
    });

    it("should not allow duplicate event scans by guest", async () => {
        const res = await request(app)
            .post(`/guests/${guestId}/scans`)
            .send({ eventId });

        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/already scanned/i);
    });

    it("should return scan status for all events", async () => {
        const res = await request(app).get(`/guests/${guestId}/events-scans`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.events)).toBe(true);
        expect(
            res.body.events.find((e) => e._id.toString() === eventId.toString())
                .scanned
        ).toBe(true);
    });
});
