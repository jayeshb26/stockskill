const express = require("express");
const {
  getWinnerResultsByDate,
  claimeTicket,
  getBetHistroy,
  addPointRequest,
  getAllBetHistroy,
  addComplaint,
  get7Days,
} = require("../controllers/players");
const { protect, authorize } = require("../middleware/auth");
const Bet = require("../models/Bet");
const advancedResults = require("../middleware/advancedResults");

const router = express.Router();

//use middleware to protect, authorize
router.use(protect);
router.route("/betHistroy/").get(advancedResults(Bet), getAllBetHistroy);
router.get("/betHistroy/:playerId", getBetHistroy);

router.use(authorize("player"));

router.route("/winResultByDate/:date").get(getWinnerResultsByDate);
router.route("/days7/:date").get(get7Days);
router.route("/complaint").post(addComplaint);
router.route("/point").post(addPointRequest);
module.exports = router;
