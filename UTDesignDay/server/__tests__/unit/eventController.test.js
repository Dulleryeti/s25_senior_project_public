// here is eventController.test.js

const eventAPI = require("../../controllers/eventController");
const { Event } = require("../../models/event");
const { Team } = require("../../models/team");

jest.mock("../../models/event");
jest.mock("../../models/team");

describe("Event Controller - Unit Tests", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("getEvents", () => {
        it("should return all events with teams populated", async () => {
            const mockEvents = [{ name: "Event 1" }, { name: "Event 2" }];
            Event.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockEvents),
            });

            const req = {};
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await eventAPI.getEvents(req, res);

            expect(Event.find).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ events: mockEvents });
        });

        it("should handle errors", async () => {
            Event.find.mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error("DB error")),
            });

            const req = {};
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await eventAPI.getEvents(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                error: "Failed to fetch events",
            });
        });
    });

    describe("getEvent", () => {
        it("should return a specific event by ID", async () => {
            const mockEvent = { name: "Event 1" };
            Event.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockEvent),
            });

            const req = { params: { eventId: "123" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await eventAPI.getEvent(req, res);

            expect(Event.findById).toHaveBeenCalledWith("123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockEvent);
        });

        it("should return 404 if event not found", async () => {
            Event.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null),
            });

            const req = { params: { eventId: "missing" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await eventAPI.getEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Event not found",
            });
        });
    });

    describe("getEventTeams", () => {
        it("should return teams for a given event", async () => {
            const mockTeams = [{ name: "Team A" }, { name: "Team B" }];
            Team.find.mockResolvedValue(mockTeams);

            const req = { params: { eventId: "abc" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await eventAPI.getEventTeams(req, res);

            expect(Team.find).toHaveBeenCalledWith({ event: "abc" });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ teams: mockTeams });
        });
    });

    describe("getEventTeam", () => {
        it("should return a specific team within an event", async () => {
            const mockTeam = { name: "Team 1" };
            Team.findOne.mockResolvedValue(mockTeam);

            const req = { params: { teamId: "1", eventId: "event123" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await eventAPI.getEventTeam(req, res);

            expect(Team.findOne).toHaveBeenCalledWith({
                _id: "1",
                event: "event123",
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTeam);
        });

        it("should return 404 if team not found in event", async () => {
            Team.findOne.mockResolvedValue(null);

            const req = { params: { teamId: "1", eventId: "event123" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await eventAPI.getEventTeam(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: "Team not found in this event",
            });
        });
    });

    describe("getRandomEvents", () => {
        it("should return a sample of random events", async () => {
            const mockEvents = [{ name: "Random Event" }];
            Event.aggregate.mockResolvedValue(mockEvents);

            const req = { query: { count: "1" } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };

            await eventAPI.getRandomEvents(req, res);

            expect(Event.aggregate).toHaveBeenCalledWith([
                { $sample: { size: 1 } },
            ]);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ events: mockEvents });
        });
    });
});
