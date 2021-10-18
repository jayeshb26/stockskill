const mongoose = require("mongoose");
//Set you offset here like +5.5 for IST
var offsetIST = 19800000;

//Create a new date from the Given string
var d = new Date();

//To convert to UTC datetime by subtracting the current Timezone offset
var utcdate = new Date(d.getTime());

//Then cinver the UTS date to the required time zone offset like back to 5.5 for IST
var istdate = new Date(utcdate.getTime() + offsetIST)

const PaymentSchema = new mongoose.Schema({
    toId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    fromId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    creditPoint: {
        type: Number,
        required: true,
    },
    macAddress: {
        type: String,
        required: [true, "Your System is not Verified"]
    },
    status: {
        type: String,
        default: "Pending"
    },
    DrTime: {
        type: String,
        default: istdate.getHours().toString() + " : " + istdate.getMinutes().toString() + " : " + istdate.getSeconds().toString(),
    },
    DrDate: {
        type: String,
        default: istdate.getFullYear().toString() + "-" + (istdate.getMonth() + 1).toString() + "-" + istdate.getDate().toString(),
    },
    createDate: {
        type: Date,
        default: istdate,
    }
}, { timestamps: true })

module.exports = mongoose.model("Payment", PaymentSchema);