const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  // forgotPassword,
  // resetPassword,
  updateDetails,
  updatePassword,
  updateTransactionPin,
  loginPlayer,
  getTransactions,
  logoutPlayer,
  getUserName,
  getUser,
} = require("../controllers/auth");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();
// router.post("/", register);
router.post("/login", login);
router.post("/player/login", loginPlayer);
router.get("/logout", logout);
router.get("/playerLogout/:id", logoutPlayer);
router.get("/transactions", protect, getTransactions);
router.route("/user/:id").get(getUser);
router.route("/me").get(protect, getMe);
router.put("updatedetails", protect, updateDetails);
router.post("/updatepassword", protect, updatePassword);
router.put("/updateTransactionPin", protect, updateTransactionPin);
router.get("/userName", protect, getUserName);
module.exports = router;
