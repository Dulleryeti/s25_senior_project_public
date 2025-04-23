// here is where integration tests for eventController will go

require("../setup");
const request = require("supertest");
const path = require("path");
const app = require("../../app");

// this is to mock middleware for auth
jest.mock("../../middleware/auth", () => ({
    verifyToken: (req, res, next) => {
        req.user = { role: "admin" };
        next();
    },
    requireRole: () => (req, res, next) => next(),
}));

// mock aws s3 bucket upload and delete that way it wont flood my actual s3 bucket with test images
jest.mock("@aws-sdk/client-s3", () => {
    const actual = jest.requireActual("@aws-sdk/client-s3");
    return {
        ...actual,
        S3Client: jest.fn(() => ({
            send: jest.fn(() => Promise.resolve({})),
        })),

        PutObjectCommand: jest.fn(),
        DeleteObjectCommand: jest.fn(),
    };
});

// creating, editing, and deleting events and teams successfull cases
describe("Event Routes Admin Creation - Integration Tests", () => {
    let createdEventId;
    let createdTeamId;

    it("creates a new event when provided with valid data", async () => {
        const res = await request(app)
            .post("/events")
            .field("name", "Integration Test Event")
            .field("location", "Test Location")
            .field("description", "Test Desc")
            .field("startTime", "10:00 AM")
            .field("endTime", "11:00 PM")
            .field("eventType", "Activity")
            .attach("image", path.join(__dirname, "fixture_test.png"));

        expect(res.status).toBe(201);
        expect(res.body.event.name).toBe("Integration Test Event");
        createdEventId = res.body.event._id;
    });

    it("should successfully update the event with valid input", async () => {
        const res = await request(app)
            .put(`/events/${createdEventId}`)
            .field("name", "Updated Event Name")
            .field("location", "New Location")
            .field("description", "Updated Desc")
            .field("startTime", "9:00 AM")
            .field("endTime", "11:00 PM")
            .field("eventType", "Activity")
            .attach("image", path.join(__dirname, "fixture_test.png"));

        if (res.status !== 200) {
            console.log("Edit Event Error:", res.body);
        }
        expect(res.status).toBe(200);
        expect(res.body.event.name).toBe("Updated Event Name");
    });

    it("should create a team when provided with valid data", async () => {
        const res = await request(app)
            .post(`/events/${createdEventId}/teams`)
            .field("name", "Test Team")
            .field("location", "Team Room")
            .field("startTime", "8:00 AM")
            .field("endTime", "9:00 PM")
            .field("description", "Team Description")
            .field("students", JSON.stringify(["Alice", "Bob"]))
            .attach("image", path.join(__dirname, "fixture_test.png"));

        if (res.status !== 201) {
            console.log("Create Team Error:", res.body);
        }

        expect(res.status).toBe(201);
        expect(res.body.team.name).toBe("Test Team");
        createdTeamId = res.body.team._id;
    });

    it("should successfully update the team with valid input", async () => {
        const res = await request(app)
            .put(`/events/${createdEventId}/teams/${createdTeamId}`)
            .field("name", "Updated Team")
            .field("location", "Updated Room")
            .field("startTime", "9:00 AM")
            .field("endTime", "10:00 PM")
            .field("description", "Updated Description")
            .field("students", JSON.stringify(["Alice", "Bob", "Charlie"]))
            .attach("image", path.join(__dirname, "fixture_test.png"));

        expect(res.status).toBe(200);
        expect(res.body.team.name).toBe("Updated Team");
    });

    it("returns 200 and should delete the team when provided a valid event and team id", async () => {
        const res = await request(app).delete(
            `/events/${createdEventId}/teams/${createdTeamId}`
        );

        if (res.status !== 200) {
            console.log("Delete Team Error:", res.body);
        }
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/deleted successfully/i);
    });

    it("returns 200 and deletes the event and related data when provided a valid event id", async () => {
        const res = await request(app).delete(`/events/${createdEventId}`);

        if (res.status !== 200) {
            console.log("Delete Event Error:", res.body);
        }
        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(
            /Event and associated teams deleted successfully/i
        );
    });
});

// failure cases
describe("Event Routes Admin Creation – Failure Cases", () => {
    const fakeEventId = "5f50ca4e2c8b4b1d88cfa000";
    const fakeTeamId = "5f50ca4e2c8b4b1d88cfa111";

    it("should fail to create event without an image", async () => {
        const res = await request(app)
            .post("/events")
            .field("name", "No Image Event")
            .field("location", "No Image Hall")
            .field("description", "Missing image test")
            .field("startTime", "10:00 AM")
            .field("endTime", "11:00 AM")
            .field("eventType", "Activity");

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/image file is required/i);
    });

    it("should fail to create event with unsupported file type", async () => {
        const res = await request(app)
            .post("/events")
            .field("name", "Bad Image Event")
            .field("location", "Bad Image Hall")
            .field("description", "Unsupported type test")
            .field("startTime", "10:00 AM")
            .field("endTime", "11:00 AM")
            .field("eventType", "Activity")
            .attach("image", path.join(__dirname, "hello.txt"));

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/unsupported file type/i);
    });

    it("should fail to create event with oversized image", async () => {
        const res = await request(app)
            .post("/events")
            .field("name", "Big Image Event")
            .field("location", "Overweight Image Restaurant")
            .field("description", "over 10mb test")
            .field("startTime", "10:00 AM")
            .field("endTime", "11:00 AM")
            .field("eventType", "Activity")
            .attach("image", path.join(__dirname, "big_image.png"));

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(
            /File too large. Maximum allowed size is 10MB./i
        );
    });

    it("should fail to update a non-existent event", async () => {
        const res = await request(app)
            .put(`/events/${fakeEventId}`)
            .field("name", "Ghost Event")
            .field("location", "Nowhere")
            .field("description", "This should fail")
            .field("startTime", "9:00 AM")
            .field("endTime", "10:00 AM")
            .field("eventType", "Activity")
            .attach("image", path.join(__dirname, "fixture_test.png"));

        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/event not found/i);
    });

    it("should fail to get a team from a non-existent event", async () => {
        const res = await request(app).get(
            `/events/${fakeEventId}/teams/${fakeTeamId}`
        );
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/team not found/i);
    });

    it("should fail to create a team without an image", async () => {
        // create a valid event first
        const eventRes = await request(app)
            .post("/events")
            .field("name", "No Image Team Event")
            .field("location", "Test Room")
            .field("description", "For team test")
            .field("startTime", "10:00 AM")
            .field("endTime", "11:00 AM")
            .field("eventType", "Activity")
            .attach("image", path.join(__dirname, "fixture_test.png"));

        const validEventId = eventRes.body.event._id;

        // add a team wiothout image
        const res = await request(app)
            .post(`/events/${validEventId}/teams`)
            .field("name", "No Image Team")
            .field("location", "Team Room")
            .field("startTime", "9:00 AM")
            .field("endTime", "10:00 AM")
            .field("description", "Missing image test")
            .field("students", JSON.stringify(["Charlie", "Dana"]));

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/image file is required/i);
    });

    it("should fail to update a team with malformed team id", async () => {
        const res = await request(app)
            .put(`/events/${fakeEventId}/teams/not-an-id`)
            .field("name", "Invalid ID")
            .field("location", "Anywhere")
            .field("startTime", "9:00 AM")
            .field("endTime", "10:00 AM")
            .field("description", "This should error")
            .field("students", JSON.stringify(["Test"]))
            .attach("image", path.join(__dirname, "fixture_test.png"));

        expect(res.status).toBe(500);
        expect(res.body.error).toMatch(/failed to update team/i);
    });

    it("should fail if students is not a valid array string", async () => {
        const res = await request(app)
            .post(`/events/${fakeEventId}/teams`)
            .field("name", "Invalid Students")
            .field("location", "Room")
            .field("startTime", "9:00 AM")
            .field("endTime", "10:00 AM")
            .field("description", "Bad input")
            .field("students", "Alice,Bob")
            .attach("image", path.join(__dirname, "fixture_test.png"));

        expect(res.status).toBe(500);
        expect(res.body.error).toMatch(/Failed to create team/i);
    });

    it("should fail to delete a team that doesn’t exist", async () => {
        const res = await request(app).delete(
            `/events/${fakeEventId}/teams/${fakeTeamId}`
        );
        expect(res.status).toBe(404);
        expect(res.body.message).toMatch(/team not found/i);
    });

    it("should not allow team creation for a non-Activity event type", async () => {
        // create an actual show event first
        const showRes = await request(app)
            .post("/events")
            .field("name", "No Team Show")
            .field("location", "Main Hall")
            .field("description", "A show with no teams")
            .field("startTime", "1:00 PM")
            .field("duration", 30)
            .field("eventType", "Show")
            .attach("image", path.join(__dirname, "fixture_test.png"));

        const showEventId = showRes.body.event._id;

        // then try to add a team to it
        const teamRes = await request(app)
            .post(`/events/${showEventId}/teams`)
            .field("name", "Should Fail")
            .field("location", "Nowhere")
            .field("startTime", "2:00 PM")
            .field("endTime", "3:00 PM")
            .field("description", "Nope")
            .field("students", JSON.stringify(["Test"]))
            .attach("image", path.join(__dirname, "fixture_test.png"));

        expect(teamRes.status).toBe(400);
        expect(teamRes.body.error).toMatch(
            /teams can only be added to activity events/i
        );
    });

    it("should fail to create a team for a deleted event", async () => {
        const eventRes = await request(app)
            .post("/events")
            .field("name", "Temp Event")
            .field("location", "Gone Hall")
            .field("description", "This will be deleted")
            .field("startTime", "12:00 PM")
            .field("endTime", "1:00 PM")
            .field("eventType", "Activity")
            .attach("image", path.join(__dirname, "fixture_test.png"));

        const eventId = eventRes.body.event._id;

        await request(app).delete(`/events/${eventId}`);

        const teamRes = await request(app)
            .post(`/events/${eventId}/teams`)
            .field("name", "Ghost Team")
            .field("location", "Nowhere")
            .field("startTime", "12:15 PM")
            .field("endTime", "1:00 PM")
            .field("description", "Trying to haunt")
            .field("students", JSON.stringify(["Ghost"]))
            .attach("image", path.join(__dirname, "fixture_test.png"));

        expect(teamRes.status).toBe(404);
        expect(teamRes.body.message).toMatch(/event not found/i);
    });
});
