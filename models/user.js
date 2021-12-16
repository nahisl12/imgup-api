const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    lowercase: true,
    required: true,
    match: [/^[a-zA-Z0-9]+$/, "is invalid"],
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/\S+@\S+\.\S+/, "is invalid"],
    index: true,
  },
  hash: {
    type: String,
    required: true,
  },
  joined: {
    type: Date,
  },
  images: {
    type: Array,
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
