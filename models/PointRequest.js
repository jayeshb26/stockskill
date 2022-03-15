const mongoose = require("mongoose");

const PointRequestSchema = new mongoose.Schema(
  {
    point: {
      type: Number,
      default: 0,
    },
    comment: String,
    status: {
      type: String,
      default: "Pending",
    },
    playerId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    fromId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
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
  { timetamps: true }
);
module.exports = mongoose.model("PointRequest", PointRequestSchema);
