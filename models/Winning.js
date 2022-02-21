const mongoose = require("mongoose");

const WinningSchema = new mongoose.Schema(
  {
    rouletteTimer40: {
      type: Number,
      default: 0,
    },
    rouletteTimer60: {
      type: Number,
      default: 0,
    },
    roulette: {
      type: Number,
      default: 0,
    },
    isManual: Boolean,
    listArray: [Number]
  },
  { timestamps: true }
);
module.exports = mongoose.model("Winning", WinningSchema);
