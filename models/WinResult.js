const mongoose = require("mongoose");
const x = require("uniqid");

const WinResultSchema = new mongoose.Schema(
  {
    gameName: {
      type: String,
      default: "Game Name is required",
    },
    result: {
      type: Object,
      required: true,
    },

    x: {
      type: Number,
      default: 1,
    },
    winningPercent: {
      type: Number,
      default: 90,
    },

    DrTime: {
      type: String,
      default: () =>
        new Date()
          .toLocaleString("en-US", {
            timeZone: "Asia/Calcutta",
          })
          .toString()
          .split(",")[1],
    },
    DrDate: {
      type: String,
      default: () =>
        new Date()
          .toLocaleString("en-US", {
            timeZone: "Asia/Calcutta",
          })
          .toString()
          .split(",")[0]
          .replace(/\//g, (x) => "-"),
    },
    createDate: {
      type: String,
      default: () =>
        new Date()
          .toLocaleString("en-US", {
            timeZone: "Asia/Calcutta",
          })
          .toString(),
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("WinResult", WinResultSchema);
