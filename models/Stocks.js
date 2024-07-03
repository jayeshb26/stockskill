const mongoose = require("mongoose");

const StocksSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    number: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      required: true,
    },
    market: {
      type: String,
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true, collection: "stocks" } // Specify collection name as "Stock"
);

const Stocks = mongoose.model("Stocks", StocksSchema);

module.exports = Stocks;
