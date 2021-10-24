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
  },
  { timetamps: true }
);
module.exports = mongoose.model("PointRequest", PointRequestSchema);
