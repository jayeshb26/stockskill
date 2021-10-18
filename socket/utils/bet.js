const User = require("../../models/User");
const Bet = require("../../models/Bet");
const WinResult = require("../../models/WinResult");
const Winning = require("../../models/Winning");
async function placeBet(playerId, game, position, betPoint) {
  //Verify Token
  try {
    let user = await User.findById(playerId);
    const classic = await User.findById(user.referralId);
    const executive = await User.findById(classic.referralId);
    if (user.creditPoint >= betPoint) {
      bet = await Bet.create({
        playerId,
        game,
        bet: betPoint,
        startPoint: user.creditPoint,
        userName: user.userName,
        position,
        name: user.name,
        classicCommission: (betPoint * classic.commissionPercentage) / 100,
        executiveCommission: (betPoint * executive.commissionPercentage) / 100,
        playerCommission: (betPoint * user.commissionPercentage) / 100,
      });
      await User.findByIdAndUpdate(playerId, {
        $inc: {
          creditPoint: -betPoint,
          playPoint: betPoint,
          commissionPoint: (betPoint * user.commissionPercentage) / 100,
        },
        lastBetAmount: betPoint,
      });
      await User.findByIdAndUpdate(user.referralId, {
        $inc: {
          commissionPoint: (betPoint * classic.commissionPercentage) / 100,
        },
      });
      await User.findByIdAndUpdate(classic.referralId, {
        $inc: {
          commissionPoint: (betPoint * executive.commissionPercentage) / 100,
        },
      });
      return bet._id;
    }
    return 0;
  } catch (err) {
    console.log("Error on place bet", err.message);
    return;
  }
}

async function winGamePay(price, betId, winPosition, gameName) {
  try {
    console.log(
      "WInGame Pay: price : ",
      price,
      "  betId : ",
      betId,
      " winPosition : ",
      winPosition
    );
    if (gameName == "andarBahar2") gameName = "andarBahar";

    const betData = await Bet.findByIdAndUpdate(betId, {
      $inc: { won: price },
    });
    let user = "";

    user =
      gameName == "rouletteMini"
        ? await User.findByIdAndUpdate(betData.playerId, {
            $inc: { creditPoint: price, wonPoint: price },
          })
        : await User.findByIdAndUpdate(betData.playerId, {
            $inc: { creditPoint: price, wonPoint: price, winPosition },
          });

    return betData.playerId;
  } catch (err) {
    console.log("Error on winGamePay", err.message);
    return err.message;
  }
}

//Add result of the Game
async function addGameResult(gameName, result) {
  try {
    await WinResult.create({ gameName, result });
    await Bet.updateMany(
      { $and: [{ game: gameName }, { winPosition: "" }] },
      { winPosition: result }
    );
  } catch (err) {
    console.log("Error on addGameResult", err.message);
    return err.message;
  }
}

//Add result of the Game
async function getLastrecord(gameName, playerId) {
  console.log(gameName);
  let result;
  try {
    if (gameName != "roulette")
      result = await WinResult.find({ gameName })
        .select({ result: 1, _id: 0 })
        .sort("-createdAt")
        .limit(15);
    let data = [];
    let take = 0;

    take = await User.findById(playerId);
    if (gameName != "roulette")
      for (res of result) {
        data.push(res.result);
      }

    // if (gameName == "rouletteMini")
    //   return { records: data, take: 0 }
    // else
    return { records: data };
  } catch (err) {
    console.log("Error on getLastrecord", err.message);
    return err.message;
  }
}

//Get Admin Percentage for winning Result
async function getAdminPer() {
  return await Winning.findById("602e55e9a494988def7acc25");
}
//Get current running Game Data{
async function getCurrentBetData(gameName, playerId) {
  let data = await Bet.find({ game: gameName, winPosition: "", playerId });
  return data;
}

async function updateAndarBahar(result) {
  try {
    await Bet.updateMany(
      { $and: [{ game: "andarBahar" }, { andarBaharResult: "" }] },
      { andarBaharResult: result }
    );
    return 0;
  } catch (err) {
    console.log("Error on updateAndarBahar ", err.message);
    return err.message;
  }
}

module.exports = {
  placeBet,
  winGamePay,
  getAdminPer,
  addGameResult,
  getLastrecord,
  getCurrentBetData,
  updateAndarBahar,
};
