const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
    name: { type: String, required: [true, "Name is required"] },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
    },
    encryptedPassword: {
        type: String,
        required: [true, "Password is required"],
    },
    role: { type: String, enum: ["guest", "user", "admin"], default: "guest" },

    // stores events the user has scanned (tracked punch card)
    // eventsScanned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: []}],

    // stores favorited teams
    // favoritedTeams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' , default: []}]
});

// automatically remove `encryptedPassword` from JSON responses
userSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.encryptedPassword;
        return ret;
    },
});

userSchema.methods.setEncryptedPassword = function (password) {
    var promise = new Promise((resolve, reject) => {
        bcrypt
            .hash(password, 12)
            .then((hash) => {
                this.encryptedPassword = hash;
                resolve();
            })
            .catch((err) => {
                reject(err);
            });
    });

    return promise;
};

userSchema.methods.verifyPassword = function (password) {
    var promise = new Promise((resolve, reject) => {
        bcrypt
            .compare(password, this.encryptedPassword)
            .then((isVerified) => {
                resolve(isVerified);
            })
            .catch((err) => {
                reject(err);
            });
    });

    return promise;
};

const User = mongoose.model("User", userSchema);

module.exports = {
    User: User,
};
