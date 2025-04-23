const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// trust proxy needed for rate-limiting
app.set("trust proxy", 1);

// middleware
app.use(cors());
app.use(express.json());

// mock req.io for tests
app.use((req, res, next) => {
    req.io = { emit: () => {} };
    next();
});

// api routes
app.use("/", require("./routes/userRoutes"));
app.use("/", require("./routes/eventRoutes"));
app.use("/", require("./routes/teamRoutes"));
app.use("/", require("./routes/guestRoutes"));

module.exports = app;
