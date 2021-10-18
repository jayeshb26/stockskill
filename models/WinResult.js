const mongoose = require("mongoose");





const WinResultSchema = new mongoose.Schema({

    gameName: {
        type: String,
        default: "Game Name is required"
    },
    result:String

}, { timestamps: true })

module.exports = mongoose.model("WinResult", WinResultSchema);