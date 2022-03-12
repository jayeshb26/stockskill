const { io } = require("../server");
const { getUserInfoBytoken, getUserInfo } = require("./utils/users");
const {
  placeBet,
  winGamePay,
  getAdminPer,
  addGameResult,
  getLastrecord,
  getCurrentBetData,
  getHotCold,
} = require("./utils/bet");
const immutable = require("object-path-immutable");
var _ = require("lodash");
let games = {
  rouletteTimer40: {
    startTime: new Date().getTime() / 1000,
    position: {},
    adminBalance: 0,
    hot: [],
    cold: [],
  },
  rouletteTimer60: {
    startTime: new Date().getTime() / 1000,
    position: {},
    adminBalance: 0,
    hot: [],
    cold: [],
  },
  roulette: { adminBalance: 0 },
  spinToWin: {
    startTime: new Date().getTime() / 1000,
    position: {},
    adminBalance: 0,
    hot: [],
    cold: [],
  },
  manualSpin: { adminBalance: 0 },
};

let isManual = false;
let listArray = [];
//users: use for store game Name so when user leave room than we can used
let users = {};
//used for when he won the match
let players = {};
//TransactionId
let transactions = {};
let winningPercent = {
  rouletteTimer40: 90,
  rouletteTimer60: 90,
  roulette: 90,
  spinToWin: 90,
  manualSpin: 90,
};
io.on("connection", (socket) => {
  socket.on("checkLogin", async ({ token }) => {
    let user = await getUserInfoBytoken(token);

    if (players[user._id])
      if (players[user._id] != socket.id) {
        io.to(players[user._id]).emit("res", {
          data: "Some one use your Id to other device",
          en: "logout",
          status: 1,
        });
      }
    retailers[user._id] = socket.id;
  });

  //Join Event When Application is Start
  socket.on("join", async ({ token, gameName }) => {
    let user = await getUserInfoBytoken(token);
    users[socket.id] = gameName;
    players[user._id] = socket.id;

    if (!user.isActive) {
      io.to(players[user._id]).emit("res", {
        data: "Your Account is blocked please contact Admin",
        en: "logout",
        status: 1,
      });
    }

    console.log("Join call Game name is ", gameName);
    let numbers = await getLastrecord(gameName, user._id);
    if (gameName == "roulette") {
      console.log("send join data");
      return socket.emit("res", {
        data: {
          creditPoint: user.creditPoint,
          gameName,
        },
        en: "join",
        status: 1,
      });
    }
    let gameData = await getCurrentBetData(gameName, user._id);
    socket.join(gameName);
    socket.emit("res", {
      data: {
        creditPoint: user.creditPoint,
        time: new Date().getTime() / 1000 - games[gameName].startTime,
        numbers: numbers.records,
        x: numbers.x,
        hot: games[gameName].hot,
        cold: games[gameName].cold,
        gameName,
        gameData,
      },
      en: "join",
      status: 1,
    });
  });

  socket.on("joinAdmin", async ({ adminId }) => {
    try {
      let user = await getUserInfo(adminId);
      if (user.role == "Admin") {
        socket.join("adminData");
        socket.emit("resAdmin", {
          data: games,
        });
      } else
        socket.emit("res", {
          data: "You are not authorised to access this information",
          en: "error",
        });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("changeAdminBalance", async ({ adminId, data }) => {
    try {
      console.log(adminId, data);
      let user = await getUserInfo(adminId);
      console.log(user);
      if (user.role == "Admin") {
        games.rouletteTimer40.adminBalance = data.rouletteTimer40;
        games.rouletteTimer60.adminBalance = data.rouletteTimer60;
        console.log("data change", adminBalance);
        socket.emit("resAdmin", {
          data: games,
        });
      } else
        socket.emit("res", {
          data: "You are not authorised to access this information",
          en: "error",
        });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("placeBet", async ({ playerId, gameName, position, betPoint }) => {
    const result = await placeBet(playerId, gameName, position, betPoint);
    console.log(
      playerId,
      gameName,
      "  :  ",
      position,
      " Bet Point :  ",
      betPoint
    );
    console.log(result);
    if (result != 0 || result != undefined) {
      if (gameName == "rouletteTimer40" || gameName == "rouletteTimer60") {
        console.log("sandip Shiroya");
        playCasino(gameName, position, result);
      } else if (gameName == "spinToWin")
        playSpinToWin(gameName, position, result);
      console.log("Viju vinod Chopda before : ", games[gameName].adminBalance);

      if (betPoint)
        games[gameName].adminBalance +=
          (betPoint * winningPercent[gameName]) / 100;

      console.log(
        "Viju vinod Chopda Admin balance is: ",
        games[gameName].adminBalance
      );
    }

    socket.to("adminData").emit("resAdmin", {
      data: games,
    });
    socket.emit("res", {
      data: {
        handId: result,
        gameName,
        result:
          result == 0
            ? "You don't have sufficient Balance or Error on Place bet"
            : "Place Bet Success",
      },
      en: "placeBet",
      status: 1,
    });
  });

  socket.on("leaveRoom", ({ gameName, userId }) => {
    socket.leave(gameName);
    delete users[socket.id];

    delete players[userId];
  });

  socket.on("placeBetRoulette", async ({ playerId, position, betPoint }) => {
    const transId = await placeBet(playerId, "roulette", position, betPoint);
    console.log("roulette", "  :  ", position, " Bet Point :  ", betPoint);
    let numMultiply = 36;
    if (transId != 0) {
      if (betPoint)
        games.roulette.adminBalance +=
          (betPoint * winningPercent.roulette) / 100;
      let game = { position: {} };
      for (const pos of position) {
        for (const num of pos[Object.keys(pos)[0]]) {
          numMultiply = pos[Object.keys(pos)[0]].length > 6 ? 36 : 35;
          let wonAmount =
            (pos.amount * numMultiply) / pos[Object.keys(pos)[0]].length;
          game.position = immutable.update(game.position, [num], (v) =>
            v ? v + wonAmount : wonAmount
          );
        }
      }
      let result = getResultRoulette(game.position);
      console.log("Result is ", result);
      let winAmount = 0;
      if (game.position[result]) winAmount = game.position[result];
      await winGamePay(winAmount, transId, result);
      socket.emit("res", {
        data: {
          handId: transId,
          gameName: "roulette",
          data: result,
          winAmount,
        },
        en: "result",
        status: 1,
      });

      console.log(
        "Roullete Royal Admin balance is: ",
        games.roulette.adminBalance,
        "& result is : ",
        result
      );
    }
    if (!isManual && listArray.length != 0)
      winningPercent.roulette =
        listArray[Math.floor(Math.random() * listArray.length)];
  });

  socket.on("placeBetManualSpin", async ({ playerId, position, betPoint }) => {
    const transId = await placeBet(playerId, "roulette", position, betPoint);
    console.log("roulette", "  :  ", position, " Bet Point :  ", betPoint);

    if (transId != 0) {
      if (betPoint)
        games.roulette.adminBalance +=
          (betPoint * winningPercent.roulette) / 100;
      let game = { position: {} };
      for (const pos of position) {
        for (const num of pos[Object.keys(pos)[0]]) {
          let wonAmount = (pos.amount * 9) / pos[Object.keys(pos)[0]].length;
          game.position = immutable.update(game.position, [num], (v) =>
            v ? v + wonAmount : wonAmount
          );
        }
      }
      let result = getResultManualSpin(game.position);
      console.log("Result is ", result);
      let winAmount = 0;
      if (game.position[result]) winAmount = game.position[result];
      await winGamePay(winAmount, transId, result);
      socket.emit("res", {
        data: {
          handId: transId,
          gameName: "manualSpin",
          data: result,
          winAmount,
        },
        en: "result",
        status: 1,
      });

      console.log(
        "Roullete Royal Admin balance is: ",
        games.roulette.adminBalance,
        "& result is : ",
        result
      );
    }
    if (!isManual && listArray.length != 0)
      winningPercent.roulette =
        listArray[Math.floor(Math.random() * listArray.length)];
  });

  //Disconnect the users
  socket.on("disconnect", () => {
    if (users[socket.id]) {
      socket.leave(users[socket.id]);
      delete users[socket.id];
      for (let userId in players) {
        if (players[userId] == socket.id) delete players[userId];
      }
    }
  });

  socket.on("beep", () => {
    socket.emit("boop", {
      data: {},
      status: 1,
    });
  });
});

setInterval(async () => {
  // if (new Date().getHours() > 7 && new Date().getHours() < 22) {

  if (new Date().getTime() / 1000 > games.rouletteTimer40.startTime + 53) {
    getResult("rouletteTimer40", 36);
  }
  if (new Date().getTime() / 1000 > games.spinToWin.startTime + 60) {
    getResult("spinToWin", 9);
  }
  if (new Date().getTime() / 1000 > games.rouletteTimer60.startTime + 73) {
    getResult("rouletteTimer60", 36);
  }

  //Get Admin Percentage
  if (
    parseInt(new Date().getMinutes()) % 3 == 0 &&
    new Date().getSeconds() == 1
  ) {
    let p = await getAdminPer();
    console.log("This is the data", p);
    if (p.isManual) {
      winningPercent.roulette = p.roulette;
      winningPercent.rouletteTimer40 = p.rouletteTimer40;
      winningPercent.rouletteTimer60 = p.rouletteTimer60;
      isManual = p.isManual;
      listArray = p.listArray;
    } else {
    }
  }
  if (new Date().getMinutes() % 10 == 0 && new Date().getSeconds() == 1) {
    console.log("call thayu");
    let hotAndCold = await getHotCold("rouletteTimer40");
    games.rouletteTimer40.hot = hotAndCold.hot;
    games.rouletteTimer40.cold = hotAndCold.cold;
    hotAndCold = await getHotCold("rouletteTimer60");
    games.rouletteTimer60.hot = hotAndCold.hot;
    games.rouletteTimer60.cold = hotAndCold.cold;
    hotAndCold = await getHotCold("spinToWin");
    games.spinToWin.hot = hotAndCold.hot;
    games.spinToWin.cold = hotAndCold.cold;
  }
  //}
}, 1000);

getResultRoulette = (position) => {
  let result = "";
  let resultArray = [];
  let sortResult = sortObject(position);
  let lowestResult = "";
  console.log("Roulette Royal SortResult is", sortResult);

  for (const num of sortResult) {
    let value = Object.values(num)[0];
    let key = Object.keys(num)[0];
    console.log("value : ", value, " key : ", key);
    if (value < games.roulette.adminBalance) {
      if (position[result] != position[key]) resultArray = [];
      resultArray.push(key);
      result = resultArray[Math.floor(Math.random() * resultArray.length)];
      lowestResult = result;
    }
    if (value > games.roulette.adminBalance) {
      break;
    }
  }
  console.log("Roullete royal Result is :", result, "num : ", position[result]);
  if (result == "") result = Math.round(Math.random() * 36);
  let counter = 0;
  if (position[result]) {
    console.log("Akhir mei andar aaya", position[result]);
    while (games.roulette.adminBalance < position[result]) {
      console.log("pasand nahi aaya", result);
      result = Math.round(Math.random() * 36);
      counter++;
      if (counter == 100) {
        if (lowestResult != "") result = lowestResult;
        else result = Math.round(Math.random() * 36);
        break;
      }
    }
  }
  //await addGameResult("roulette", result);
  if (position[result]) games.roulette.adminBalance -= position[result];
  return result;
};

getResultManualSpin = (position) => {
  let result = "";
  let resultArray = [];
  let sortResult = sortObject(position);
  let lowestResult = "";
  console.log("Roulette Royal SortResult is", sortResult);

  for (const num of sortResult) {
    let value = Object.values(num)[0];
    let key = Object.keys(num)[0];
    console.log("value : ", value, " key : ", key);
    if (value < games.roulette.adminBalance) {
      if (position[result] != position[key]) resultArray = [];
      resultArray.push(key);
      result = resultArray[Math.floor(Math.random() * resultArray.length)];
      lowestResult = result;
    }
    if (value > games.roulette.adminBalance) {
      break;
    }
  }
  console.log("Roullete royal Result is :", result, "num : ", position[result]);
  if (result == "") result = Math.round(Math.random() * 9);
  let counter = 0;
  if (position[result]) {
    console.log("Akhir mei andar aaya", position[result]);
    while (games.roulette.adminBalance < position[result]) {
      console.log("pasand nahi aaya", result);
      result = Math.round(Math.random() * 9);
      counter++;
      if (counter == 100) {
        if (lowestResult != "") result = lowestResult;
        else result = Math.round(Math.random() * 9);
        break;
      }
    }
  }
  //await addGameResult("roulette", result);
  if (position[result]) games.roulette.adminBalance -= position[result];
  return result;
};

getResult = async (gameName, stopNum) => {
  let result = "";
  let resultArray = [];
  let sortResult = "";
  let lowestResult = "";
  let x = 1;
  games[gameName].startTime = new Date().getTime() / 1000;

  if (Object.keys(games[gameName].position).length != undefined) {
    sortResult = sortObject(games[gameName].position);

    for (const num of sortResult) {
      let value = Object.values(num)[0];
      let key = Object.keys(num)[0];
      if (value < games[gameName].adminBalance) {
        if (games[gameName].position[result] != games[gameName].position[key]) {
          resultArray = [];
        }
        resultArray.push(key);
        result = resultArray[Math.floor(Math.random() * resultArray.length)];
        lowestResult = result;
      }
      if (value > games[gameName].adminBalance) {
        break;
      }
    }
  }

  if (result == "") {
    result = Math.round(Math.random() * stopNum);
  }

  let counter = 0;
  if (games[gameName].position[result])
    while (games[gameName].adminBalance < games[gameName].position[result]) {
      result = Math.round(Math.random() * stopNum);
      counter++;

      if (counter == 100) {
        //aaya Error mali ti
        if (lowestResult != "") result = lowestResult;
        else result = Math.round(Math.random() * stopNum);
        break;
      }
    }
  //change thayu last ma aa
  x = Math.floor(Math.random() * 4) + 1;

  if (gameName == "spinToWin") {
    if (games[gameName].adminBalance > games[gameName].position[result] * x) {
      for (const transId in transactions[gameName][result]) {
        transactions[gameName][result][transId] =
          transactions[gameName][result][transId] * x;
      }
    } else x = 1;
  }

  io.in(gameName).emit("res", {
    data: {
      gameName,
      data: result,
      x,
    },
    en: "result",
    status: 1,
  });

  if (games[gameName].position[result])
    games[gameName].adminBalance -= games[gameName].position[result];

  await addGameResult(gameName, result, x, winningPercent[gameName]);

  // Pay Out of the winners
  await payTransaction(gameName, result);
  flushAll(gameName);
};

payTransaction = async (gameName, result) => {
  console.log(
    "&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",
    gameName,
    result,
    transactions[gameName]
  );
  if (transactions[gameName])
    if (transactions[gameName][result]) {
      for (let transId in transactions[gameName][result]) {
        console.log(
          "Result Price is :",
          transactions[gameName][result][transId]
        );
        let userId = await winGamePay(
          transactions[gameName][result][transId],
          transId,
          result,
          gameName
        );
        io.to(players[userId]).emit("res", {
          data: {
            gameName,
            data: { winAmount: transactions[gameName][result][transId] },
          },
          en: "winner",
          status: 1,
        });
      }
    }
};

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

flushAll = (gameName) => {
  games[gameName].position = {};
  transactions[gameName] = {};
  if (!isManual && listArray.length != 0) {
    winningPercent[gameName] =
      listArray[Math.floor(Math.random() * listArray.length)];
  }
};

playCasino = (gameName, position, result) => {
  let numMultiply = 36;
  for (const pos of position) {
    for (const num of pos[Object.keys(pos)[0]]) {
      numMultiply = pos[Object.keys(pos)[0]].length > 6 ? 36 : 35;

      let wonAmount =
        (pos.amount * numMultiply) / pos[Object.keys(pos)[0]].length;
      games[gameName].position = immutable.update(
        games[gameName].position,
        [num],
        (v) => (v ? v + wonAmount : wonAmount)
      );
      transactions[gameName] = immutable.update(
        transactions[gameName],
        [num, result],
        (v) => (v ? v + wonAmount : wonAmount)
      );
    }
  }
  console.log("This is data", games);
  console.log("This is the Dtata: ", games[gameName].position);
};
playSpinToWin = (gameName, position, result) => {
  for (const pos in position) {
    games[gameName].position = immutable.update(
      games[gameName].position,
      [pos],
      (v) => (v ? v + position[pos] * 9 : position[pos] * 9)
    );
    transactions[gameName] = immutable.update(
      transactions[gameName],
      [pos, result],
      (v) => (v ? v + position[pos] * 9 : position[pos] * 9)
    );
  }
};
