const mongoose = require("mongoose");

const ForgetPasswordSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      default: "",
    },
  },
  { timetamps: true }
);
module.exports = mongoose.model("ForgetPassword", ForgetPasswordSchema);
