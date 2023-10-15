const mongoose = require("mongoose");

const MarketSchema = new mongoose.Schema({
  gamename: {
    type: String,
    required: true,
  },
  market: {
    type: String,
    required: true,
  },
  
  closetime: {
    type: String, // You can change the data type to match your needs (e.g., Date, String, etc.)
    required: true,
  },
  starttime: {
    type: String, // You can change the data type to match your needs (e.g., Date, String, etc.)
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    
    type: String, // You can change the data type to match your needs (e.g., Number, Boolean, etc.)
    required: true,
  },
},
{ timestamps: true, collection: "market" }
);

//const Game = mongoose.model('Market', MarketSchema);
module.exports = mongoose.model("Market", MarketSchema);
//module.exports = Game;





//module.exports = mongoose.model("Bet", BetSchema);
