const mongoose = require("mongoose");


const ComplaintSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        default: ""
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

}, { timestamps: true })
module.exports = mongoose.model("Complaint", ComplaintSchema);