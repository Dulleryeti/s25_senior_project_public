const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

// const app = express();

// needed for express-rate-limit to work for login limitng.
// app.set('trust proxy', 1);

// create http server for websockets
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Database Connected");
    })
    .catch((e) => {
        console.log(e);
    });

// app.use(cors());
// app.use(express.json());

const port = 8080;
app.use((req, res, next) => {
    req.io = io;
    next();
});

// app.use("/", require("./routes/userRoutes"));
// app.use("/", require("./routes/eventRoutes"));
// app.use("/", require("./routes/teamRoutes"));
// app.use("/", require("./routes/guestRoutes"));

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
