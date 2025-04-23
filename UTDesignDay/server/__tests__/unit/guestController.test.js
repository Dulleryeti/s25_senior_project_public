// this is where the unit tests for the guestController will be

// this is where the unit tests for the guestController will be

const guestAPI = require("../../controllers/guestController");
const { Vote } = require("../../models/vote");
const { Scan } = require("../../models/scan");
const { Event } = require("../../models/event");

jest.mock("../../models/vote");
jest.mock("../../models/scan");
jest.mock("../../models/event");

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe("guestController Unit Tests", () => {
    describe("getVotes", () => {
        it("should return votes for a guest", async () => {
            const req = { params: { guestId: "guest123" } };
            const res = mockRes();

            Vote.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(["vote1"]),
            });

            await guestAPI.getVotes(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ votes: ["vote1"] });
        });
    });

    describe("postVotes", () => {
        it("should create a new vote if none exists", async () => {
            const req = {
                params: { guestId: "guest123" },
                body: { eventId: "event123", teamId: "team456" },
                io: { emit: jest.fn() },
            };
            const res = mockRes();

            Vote.findOne.mockResolvedValue(null);
            Vote.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue(true),
            }));

            await guestAPI.postVotes(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Vote recorded" })
            );
        });

        it("should return 400 if guest already voted", async () => {
            const req = {
                params: { guestId: "guest123" },
                body: { eventId: "event123", teamId: "team456" },
            };
            const res = mockRes();

            Vote.findOne.mockResolvedValue({});

            await guestAPI.postVotes(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: "Guest already voted for this event",
            });
        });
    });

    describe("getEventsScanStatus", () => {
        it("should annotate events with scan status", async () => {
            const req = { params: { guestId: "guest123" } };
            const res = mockRes();

            Event.find.mockResolvedValue([
                { _id: "e1", toObject: () => ({ _id: "e1" }) },
            ]);
            Scan.find.mockResolvedValue([{ event: "e1" }]);

            await guestAPI.getEventsScanStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                events: [{ _id: "e1", scanned: true }],
            });
        });
    });

    describe("scanEvent", () => {
        it("should save a scan and emit event", async () => {
            const req = {
                params: { guestId: "guest123" },
                body: { eventId: "event123" },
                io: { emit: jest.fn() },
            };
            const res = mockRes();

            Scan.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue(true),
            }));

            await guestAPI.scanEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Event scanned" })
            );
        });

        it("should return 409 on duplicate scan error", async () => {
            const req = {
                params: { guestId: "guest123" },
                body: { eventId: "event123" },
                io: { emit: jest.fn() },
            };
            const res = mockRes();

            Scan.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue({ code: 11000 }),
            }));

            await guestAPI.scanEvent(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                message: "Event already scanned by guest",
                alreadyScanned: true,
            });
        });
    });
});
