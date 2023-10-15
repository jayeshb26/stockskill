const User = require("../../models/User");
const Bet = require("../../models/Bet");
const Market = require("../../models/Market");
const WinResult = require("../../models/WinResult");
const Stock = require("../../models/Stocks");
const Winning = require("../../models/Winning");
const _ = require("lodash");

//import urid from '../../node_modules/urid';
//var urid = require('../../node_modules/urid');
async function placeBet(playerId, game, position, betPoint,bar,session,buckettype) {
  //Verify Token
  try {
    let player = await User.findById(playerId);
    const classic = await User.findById(player.referralId);
    const executive = await User.findById(classic.referralId);
    const premium = await User.findById(executive.referralId);
    const agent = await User.findById(premium.referralId);
    console.log("*******************************************");
    console.log("Player : ", player);
    console.log("classic : ", classic);
    console.log("executive : ", executive);
    console.log("premium : ", premium);
    console.log("agent : ", agent);
    console.log("*******************************************");
    let bet = "";
    if (player.creditPoint >= betPoint) {
     // let bar=new Date().valueOf();
      bet = await Bet.create({
        playerId,
        game,
        bet: betPoint,
        startPoint: player.creditPoint,
        userName: player.userName,
        position,
        name: player.name,
        barcode:bar,
        session:session,
        bucket:buckettype,

        classicCommission: (betPoint * classic.commissionPercentage) / 100,
        executiveCommission: (betPoint * executive.commissionPercentage) / 100,
        playerCommission: (betPoint * player.commissionPercentage) / 100,
        premiumCommission: (betPoint * premium.commissionPercentage) / 100,
        agentCommission: (betPoint * agent.commissionPercentage) / 100,
      });
      console.log("Sandip****************1");
      await User.findByIdAndUpdate(playerId, {
        $inc: {
          creditPoint: -betPoint,
          playPoint: betPoint,
          commissionPoint: (betPoint * player.commissionPercentage) / 100,
        },
        lastBetAmount: betPoint,
      });
      console.log("Sandip****************2");
      await User.findByIdAndUpdate(player.referralId, {
        $inc: {
          commissionPoint: (betPoint * classic.commissionPercentage) / 100,
        },
      });
      console.log("Sandip****************3");
      await User.findByIdAndUpdate(classic.referralId, {
        $inc: {
          commissionPoint: (betPoint * executive.commissionPercentage) / 100,
        },
      });
      console.log("Sandip****************4");
      await User.findByIdAndUpdate(executive.referralId, {
        $inc: {
          commissionPoint: (betPoint * premium.commissionPercentage) / 100,
        },
      });
      console.log("Sandip****************5");
      await User.findByIdAndUpdate(premium.referralId, {
        $inc: {
          commissionPoint: (betPoint * agent.commissionPercentage) / 100,
        },
      });
     //  console.log("place bet inserted:",bet._id);
      return bet._id;
    }
    return 0;
  } catch (err) {   
    console.log("Error on place bet", err.message);
    return;
  }
}

async function winGamePay(price, betId, winPosition) {
  try {
    console.log(
      "WInGame Pay: price : ",
      price,
      "  betId : ",
      betId,
      " winPosition : ",
      winPosition
    );

    const betData = await Bet.findByIdAndUpdate(betId, {
      $inc: { won: price },
      winPosition,
    });
    let player = "";

    player = await User.findByIdAndUpdate(betData.playerId, {
      $inc: { creditPoint: price, wonPoint: price, winPosition },
    });

    return betData.playerId;
  } catch (err) {
    console.log("Error on winGamePay", err.message);
    return err.message;
  }
}

//Add result of the Game
async function addGameResult(gameName, result, x, winningPercent) {
  try {
    await WinResult.create({ gameName, result, x, winningPercent });
    await Bet.updateMany(
      { $and: [{ game: gameName }, { winPosition: "" }] },
      { winPosition: result }
    );
  } catch (err) {
    console.log("Error on addGameResult", err.message);
    return err.message;
  }
}
async function getRandomStock() {
  try {
    const randomStock = await Stock.aggregate([{ $sample: { size: 1 } }]);
    if (randomStock.length > 0) {
     // console.log(randomStock[0]);
      return randomStock[0]; // This will be the randomly selected stock document
    } else {
      console.log("No stocks found.");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    // Close mongoose connection if needed
    // mongoose.connection.close();
  }
}
async function getActivemarket() {
  console.log("getActivemarket");
  try {
    const acm = Market.find({ status:"active"});
    
    return  acm;
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    // Close mongoose connection if needed
    // mongoose.connection.close();
  }
}

//Add result of the Game
async function getLastrecord(gameName, playerId) {
  console.log(gameName);
  let result;
  try {
    if (gameName != "roulette")
      result = await WinResult.find({ gameName })
        .select({ result: 1, x: 1, _id: 0 })
        .sort("-createdAt")
        .limit(15);
    let data = [];
    let x = [];

    if (gameName != "roulette")
      for (let res of result) {
        data.push(res.result);
        x.push(res.x);
      }

    // if (gameName == "rouletteMini")
    //   return { records: data, take: 0 }
    // else
    return { records: data, x: x };
  } catch (err) {
    console.log("Error on getLastrecord", err.message);
    return err.message;
  }
}

async function getResult1() {
  console.log(gameName);
  let result;
  try {
    if (gameName != "roulette")
      result = await WinResult.find({ gameName })
        .select({ result: 1, x: 1, _id: 0 })
        .sort("-createdAt")
        .limit(15);
    let data = [];
    let x = [];

    if (gameName != "roulette")
      for (let res of result) {
        data.push(res.result);
        x.push(res.x);
      }

    // if (gameName == "rouletteMini")
    //   return { records: data, take: 0 }
    // else
    return { records: data, x: x };
  } catch (err) {
    console.log("Error on getLastrecord", err.message);
    return err.message;
  }
}

async function getStockrecord() {
  console.log("getdata stock");
  let result;
  try {
    let data = [];
    const stocks = await Stock.find({});
   // console.log(stocks);
    for (let res of stocks) {
      data.push(  {
        "number":res.number,
        "name":res.name,
        "symbol":res.symbol,
        "market":res.market,
    
    });
     // x.push(res.x);
    }
    return { records: data };
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
   // mongoose.connection.close();
  }
//   try {
//   //  if (gameName != "roulette")
//     //   result = await Stock.find({ status: 1 })
//     //     .select({ result: 1, x: 1, _id: 0 })
//     //     .sort("-number")
//     //     .limit(100);
//     // let data = [];
//     // let x = [];

//     // console.log(result);
//     //   for (let res of result) {
//     //     data.push(res.result);
//     //     x.push(res.x);
//     //   }

//     // if (gameName == "rouletteMini")
//     //   return { records: data, take: 0 }
//     // else
//    // const stocks = await Stock.find({});
//    console.log(Stock);
//    result = await Stock.find({ });
//     //    .select({ result: 1, x: 1, _id: 0 })
//          //.sort("-number")
//          //.limit(100);
// //const stocks = await cursor.toArray();
//     console.log(result);
//     return { records: result};
//   } catch (err) {
//     //console.log("Error on getstockrecord", err.message);
//    // return err.message;
//   }
}
//Get Admin Percentage for winning Result
async function getAdminPer() {
  return await Winning.findById("602e55e9a494988def7acc25");
}
async function getReprint(playerId,handId) {
  return await Bet.find( {"$and": [{ playerId: playerId},{_id: handId }]});
//console.log(reprint);
}
async function getCancelBet(playerId,handId,session) {
  return await Bet.findOneAndUpdate( {_id: handId },{$set:{isdelete:1}});
}
//Get current running Game Data{
async function getCurrentBetData(gameName, playerId) {
  let data = await Bet.find({ game: gameName, winPosition: "", playerId });
  return data;
}

async function getHotCold(gameName) {
  let res = await WinResult.find({ gameName })
    .select({ result: 1, _id: 0 })
    .sort("-createdAt")
    .limit(50);
  let data = {};

  for (let element of res) {
    data[element.result] = data[element.result] ? data[element.result] + 1 : 1;
  }

  let data2 = sortObject(data);
  let cold = [];
  let hot = [];
  for (let i = 0; i < 5; i++) {
    cold.push(Object.keys(data2[i])[0]);
    hot.push(Object.keys(data2[data2.length - (i + 1)])[0]);
  }
  return { hot, cold };
}

async function getDetails(startdate,enddate) {
  let gameName = "stockskill";
   let res = await WinResult.find({ gameName })
     .select({ result: 1, _id: 0 })
     .sort("-createdAt")
     .limit(50);
   let data = {};
//
   for (let element of res) {
     data[element.result] = data[element.result] ? data[element.result] + 1 : 1;
   }

   let data2 = sortObject(data);
   console.log(data2);
  // let cold = [];
  // let hot = [];
  // for (let i = 0; i < 5; i++) {
  //   cold.push(Object.keys(data2[i])[0]);
  //   hot.push(Object.keys(data2[data2.length - (i + 1)])[0]);
  // }
  // return { hot, cold };
}


sortObject = (entry) => {
  const sortKeysBy = function (obj, comparator) {
    var keys = _.sortBy(_.keys(obj), function (key) {
      return comparator ? comparator(obj[key], key) : key;
    });
    console.log(keys);
    return _.map(keys, function (key) {
      return { [key]: obj[key] };
    });
  };

  const sortable = sortKeysBy(entry, function (value, key) {
    return value;
  });

  return sortable;
};
module.exports = {
  placeBet,
  winGamePay,
  getAdminPer,
  addGameResult,
  getLastrecord,
  getStockrecord,
  getCurrentBetData,
  getHotCold,
  getDetails,
  getRandomStock,
  getReprint,
  getCancelBet,
  getActivemarket,
};