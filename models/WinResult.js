const mongoose = require("mongoose");
const x = require("uniqid");

const WinResultSchema = new mongoose.Schema(
  {
    gameName: {
      type: String,
      default: "Game Name is required",
    },
    result: String,

    x: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WinResult", WinResultSchema);
