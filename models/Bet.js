const mongoose = require("mongoose");

const BetSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    game: {
      type: String,
      enum: ["rouletteTimer40", "rouletteTimer60", "roulette", "spinToWin", "manualSpin"], //if you write admin than its display error "`admin` is not a valid enum value for path`role`".
      required: true,
    },
    bet: Number,
    winPosition: {
      type: String,
      default: "",
    },
    startPoint: Number,
    userName: String,
    name: String,
    position: {
      type: Object,
      required: true,
    },
    won: {
      type: Number,
      default: 0,
    },
    playerCommission: {
      type: Number,
      default: 0,
    },
    classicCommission: {
      type: Number,
      default: 0,
    },
    ExecutiveCommission: {
      type: Number,
      default: 0,
    },
    premiumCommission: {
      type: Number,
      default: 0,
    },
    agentCommission: {
      type: Number,
      default: 0,
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
    andarBaharResult: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bet", BetSchema);
