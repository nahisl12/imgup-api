const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  folder: {
    type: String,
    default: "default",
  },
  status: {
    type: String,
    default: "private",
  },
});

const Image = mongoose.model("Image", ImageSchema);

module.exports = Image;
