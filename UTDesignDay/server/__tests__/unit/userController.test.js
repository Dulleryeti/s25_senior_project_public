// this is where the unit tests for the userController will be
const userAPI = require("../../controllers/userController");
const { User } = require("../../models/user");
const jwt = require("jsonwebtoken");

jest.mock("../../models/user");
jest.mock("jsonwebtoken");

describe("User Controller – Unit Tests", () => {
    let req, res;

    beforeEach(() => {
        req = { body: {}, params: {}, io: { emit: jest.fn() } };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            sendStatus: jest.fn(),
        };
        jest.clearAllMocks();
    });

    describe("registerUser", () => {
        it("should register a new user with valid data", async () => {
            req.body = {
                name: "Test",
                email: "test@example.com",
                password: "123456",
            };
            User.findOne.mockResolvedValue(null);
            const saveMock = jest.fn();
            const setEncryptedPasswordMock = jest.fn().mockResolvedValue();
            User.mockImplementation(() => ({
                save: saveMock,
                setEncryptedPassword: setEncryptedPasswordMock,
            }));

            await userAPI.registerUser(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.any(String),
                    user: expect.any(Object),
                })
            );
        });

        it("should fail if required fields are missing", async () => {
            req.body = { name: "", email: "", password: "" };
            await userAPI.registerUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should fail with invalid email", async () => {
            req.body = { name: "Test", email: "invalid", password: "123456" };
            await userAPI.registerUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should fail with short password", async () => {
            req.body = {
                name: "Test",
                email: "test@example.com",
                password: "123",
            };
            await userAPI.registerUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should fail if user already exists", async () => {
            req.body = {
                name: "Test",
                email: "test@example.com",
                password: "123456",
            };
            User.findOne.mockResolvedValue({});
            await userAPI.registerUser(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
        });
    });

    describe("loginUser", () => {
        it("should login with correct credentials", async () => {
            req.body = { email: "test@example.com", password: "123456" };
            const userMock = {
                verifyPassword: jest.fn().mockResolvedValue(true),
                _id: "id123",
                role: "user",
            };
            User.findOne.mockResolvedValue(userMock);
            jwt.sign.mockReturnValue("mockToken");

            await userAPI.loginUser(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                token: "mockToken",
                user: userMock,
            });
        });

        it("should fail if email is invalid", async () => {
            req.body = { email: "bademail", password: "123456" };
            await userAPI.loginUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should fail if password is too short", async () => {
            req.body = { email: "test@example.com", password: "123" };
            await userAPI.loginUser(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("should fail if user is not found", async () => {
            req.body = { email: "test@example.com", password: "123456" };
            User.findOne.mockResolvedValue(null);
            await userAPI.loginUser(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("should fail if password is incorrect", async () => {
            req.body = { email: "test@example.com", password: "wrongpass" };
            User.findOne.mockResolvedValue({
                verifyPassword: jest.fn().mockResolvedValue(false),
            });
            await userAPI.loginUser(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe("getUser", () => {
        it("should return a user if found", async () => {
            const mockUser = { name: "Henry" };
            req.params.id = "user123";
            User.findById.mockResolvedValue(mockUser);
            await userAPI.getUser(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockUser);
        });

        it("should return 404 if user not found", async () => {
            req.params.id = "user123";
            User.findById.mockResolvedValue(null);
            await userAPI.getUser(req, res);
            expect(res.sendStatus).toHaveBeenCalledWith(404);
        });
    });

    describe("logoutUser", () => {
        it("should return logout success message", async () => {
            await userAPI.logoutUser(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: expect.any(String),
            });
        });
    });
});
