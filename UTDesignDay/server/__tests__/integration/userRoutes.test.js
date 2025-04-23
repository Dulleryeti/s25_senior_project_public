// this file includes integration tests for user routes

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");
const { User } = require("../../models/user");
const { Event } = require("../../models/event");
const { Vote } = require("../../models/vote");
const { Scan } = require("../../models/scan");
const jwt = require("jsonwebtoken");
require("../setup");

let adminToken;
let regularToken;
let userId;

jest.setTimeout(15000);

beforeAll(async () => {
    // create admin user
    const admin = new User({
        name: "Admin",
        email: "admin@example.com",
        role: "admin",
    });
    await admin.setEncryptedPassword("adminpass");
    await admin.save();
    adminToken = jwt.sign(
        { id: admin._id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    // create regular user
    const user = new User({
        name: "User",
        email: "user@example.com",
        role: "user",
    });
    await user.setEncryptedPassword("userpass");
    await user.save();
    userId = user._id;
    regularToken = jwt.sign(
        { id: user._id, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
});

describe("User Routes  – Integration Tests", () => {
    it("should register a new user when provided valid credentials", async () => {
        const res = await request(app).post("/users").send({
            name: "Test User",
            email: "testuser@example.com",
            password: "password123",
        });

        expect(res.status).toBe(201);
        expect(res.body.user).toHaveProperty("_id");
    });

    it("should login when provided valid credentials", async () => {
        const res = await request(app).post("/session").send({
            email: "user@example.com",
            password: "userpass",
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
    });

    it("should fetch all users with admin access", async () => {
        const res = await request(app)
            .get("/users")
            .set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.users)).toBe(true);
    });

    it("should successfully update user role with admin access", async () => {
        const res = await request(app)
            .patch(`/users/${userId}/role`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ role: "admin" });

        expect(res.status).toBe(200);
        expect(res.body.updatedUser.role).toBe("admin");
    });

    it("should get total vote count when role is admin", async () => {
        const res = await request(app)
            .get("/admins/votes/total")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(typeof res.body.totalVotes).toBe("number");
    });

    let eventId;

    beforeAll(async () => {
        const event = await Event.create({
            name: "Vote Event",
            location: "Test Hall",
            description: "Event for vote testing",
            startTime: "10:00 AM",
            duration: 30,
            eventType: "Show",
            image: "test.jpg",
        });
        eventId = event._id;
    });

    it("should get vote counts for events when provided valid role", async () => {
        const res = await request(app)
            .get(`/admins/events/${eventId}/votes`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("eventId");
    });

    it("should fetch scan counts when provided valid role", async () => {
        const res = await request(app)
            .get("/admins/events/scans")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(typeof res.body.totalScans).toBe("number");
    });
});

describe("User Routes – Failure Cases", () => {
    it("should fail to register user if email is invalid", async () => {
        const res = await request(app).post("/users").send({
            name: "Bad Email",
            email: "not-an-email",
            password: "password123",
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/email is invalid/i);
    });

    it("should fail to register user if password is too short", async () => {
        const res = await request(app).post("/users").send({
            name: "Short Password",
            email: "shortpass@example.com",
            password: "123",
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/at least 6 characters/i);
    });

    it("should fail to register user if user already exists", async () => {
        const res = await request(app).post("/users").send({
            name: "User",
            email: "user@example.com",
            password: "userpass",
        });

        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/already exists/i);
    });

    it("should fail to login user with invalid password", async () => {
        const res = await request(app).post("/session").send({
            email: "user@example.com",
            password: "wrongpass",
        });

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it("should fail to login user with invalid email format", async () => {
        const res = await request(app).post("/session").send({
            email: "invalid",
            password: "userpass",
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/email is invalid/i);
    });

    it("should fail when editing an invalid user's role", async () => {
        const res = await request(app)
            .patch("/users/000000000000000000000000/role")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ role: "admin" });

        expect(res.status).toBe(404);
    });

    let eventId;

    beforeAll(async () => {
        const event = await Event.create({
            name: "Vote Event",
            location: "Test Hall",
            description: "Event for vote testing",
            startTime: "10:00 AM",
            duration: 30,
            eventType: "Show",
            image: "test.jpg",
        });
        eventId = event._id;
    });

    it("should fail to fetch votes counts when eventId is invalid", async () => {
        const res = await request(app)
            .get(`/admins/events/invalidid/votes`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(500);
        expect(res.body.error).toMatch(/failed to fetch vote counts/i);
    });

    it("should fail to get users when provided invalid role", async () => {
        const res = await request(app)
            .get("/users")
            .set("Authorization", `Bearer ${regularToken}`);
        expect(res.status).toBe(403);
    });
});
