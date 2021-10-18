const { io } = require("../server");
const { getUserInfoBytoken } = require("./utils/users");
const {
  placeBet,
  winGamePay,
  getAdminPer,
  addGameResult,
  getLastrecord,
  getCurrentBetData,
} = require("./utils/bet");
const immutable = require("object-path-immutable");
var _ = require("lodash");
let games = {
  rouletteTimer40: {
    startTime: new Date().getTime() / 1000,
    position: {},
    adminBalance: 0,
  },
  rouletteTimer60: {
    startTime: new Date().getTime() / 1000,
    position: {},
    adminBalance: 0,
  },
  roulette: { adminBalance: 0 },
};
//users: use for store game Name so when user leave room than we can used
let users = {};
//used for when he won the match
let players = {};
//TransactionId
let transactions = {};
let adminPer = 90;
io.on("connection", (socket) => {
  //Join Event When Application is Start
  socket.on("join", async ({ token, gameName }) => {
    let user = await getUserInfoBytoken(token);
    users[socket.id] = gameName;
    players[user._id] = socket.id;
    console.log("Join call Game name is ", gameName);
    let numbers = await getLastrecord(gameName, user._id);
    if (gameName == "roulette") {
      console.log("send join data");
      return socket.emit("res", {
        data: {
          user,
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
        user,
        time: new Date().getTime() / 1000 - games[gameName].startTime,
        numbers: numbers.records,

        gameName,
        gameData,
      },
      en: "join",
      status: 1,
    });
  });

  socket.on(
    "placeBet",
    async ({ playerId, gameName, position, betPoint, position2 }) => {
      const result = await placeBet(playerId, gameName, position, betPoint);
      console.log(
        gameName,
        "  :  ",
        position,
        " Bet Point :  ",
        betPoint,
        position2
      );
      if (result != 0) {
        if (gameName == "rouletteTimer40")
          playCasino(gameName, position, result);

        console.log(
          "Viju vinod Chopda before : ",
          games.rouletteTimer40.adminBalance,
          games[gameName].adminBalance
        );

        if (betPoint)
          games[gameName].adminBalance += (betPoint * adminPer) / 100;

        console.log(
          "Viju vinod Chopda Admin balance is: ",
          games[gameName].adminBalance
        );
      }
    }
  );
  // socket.on("takeMoney", async ({ playerId, gameName }) => {
  //   let data = await takePoint(gameName, playerId)
  //   socket.emit("res", {
  //     data, gameName, en: "takeMoney", status: 1
  //   });
  // })

  socket.on("leaveRoom", ({ gameName, userId }) => {
    socket.leave(gameName);
    delete users[socket.id];

    delete players[userId];
  });

  socket.on("placeBetRoulette", async ({ playerId, position, betPoint }) => {
    const transId = await placeBet(playerId, "roulette", position, betPoint);
    console.log("roulette", "  :  ", position, " Bet Point :  ", betPoint);

    if (transId != 0) {
      if (betPoint) games.roulette.adminBalance += (betPoint * adminPer) / 100;
      let game = { position: {} };
      for (pos of position) {
        for (num of pos[Object.keys(pos)[0]]) {
          let wonAmount = (pos.amount * 36) / pos[Object.keys(pos)[0]].length;
          game.position = immutable.update(game.position, [num], (v) =>
            v ? v + wonAmount : wonAmount
          );
        }
      }
      let result = getResultRoulette(game.position);
      console.log("Result is ", result);
      let winAmount = 0;
      if (game.position[result]) winAmount = game.position[result];
      await winGamePay(winAmount, transId, result, "roulette");
      socket.emit("res", {
        data: {
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

  if (new Date().getTime() / 1000 > games.rouletteTimer40.startTime + 40) {
    getResult("rouletteTimer40", 36);
  }

  if (new Date().getTime() / 1000 > games.rouletteTimer40.startTime + 60) {
    getResult("rouletteTimer60", 36);
  }

  //Get Admin Percentage
  // if (new Date().getMinutes() == 1 && new Date().getSeconds == 1) {
  //   let p = await getAdminPer();

  //   winningPercent = p.percent;
  // }

  //}
}, 1000);

getResultRoulette = (position) => {
  let result = "";

  let sortResult = sortObject(position);
  console.log("Roulette Royal SortResult is", sortResult);

  for (num of sortResult) {
    let value = Object.values(num)[0];
    let key = Object.keys(num)[0];
    console.log("value : ", value, " key : ", key);
    if (value < games.roulette.adminBalance) {
      result = key;
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
        result = Object.keys(position)[0];
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
  games[gameName].startTime = new Date().getTime() / 1000;

  if (Object.keys(games[gameName].position).length != undefined) {
    console.log(gameName, "Solo    Before : ", games[gameName].position);
    let sortResult = sortObject(games[gameName].position);
    console.log(gameName, "After : ", sortResult);
    for (num of sortResult) {
      let value = Object.values(num)[0];
      let key = Object.keys(num)[0];
      if (value < games[gameName].adminBalance) {
        result = key;
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
        result = Object.keys(games[gameName].position)[0];
        break;
      }
    }
  //change thayu last ma aa

  io.in(gameName).emit("res", {
    data: {
      gameName,
      data: result,
    },
    en: "result",
    status: 1,
  });

  if (games[gameName].position[result])
    games[gameName].adminBalance -= games[gameName].position[result];

  await addGameResult(gameName, result);

  // Pay Out of the winners

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
};

playCasino = (gameName, position, result) => {
  for (pos of position) {
    for (num of pos[Object.keys(pos)[0]]) {
      let wonAmount = (pos.amount * 36) / pos[Object.keys(pos)[0]].length;
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
