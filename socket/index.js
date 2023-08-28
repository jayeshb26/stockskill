const { io } = require("../server");
const { getUserInfoBytoken, getUserInfo } = require("./utils/users");
const {
  placeBet,
  winGamePay,
  getAdminPer,
  addGameResult,
  getLastrecord,
  getStockrecord,
  getCurrentBetData,
  getRandomStock,
  getHotCold,
} = require("./utils/bet");
const immutable = require("object-path-immutable");
var _ = require("lodash");
var moment = require('moment')
let games = {
  
  stockskill: {
    startTime: new Date().getTime() / 1000,
    position: {},
    adminBalance: 0,
    hot: [],
    cold: [],
  },
  
};
console.log("game start time :", games["stockskill"].startTime);

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
  stockskill: 90,
};
io.on("connection", (socket) => {
  console.info(`Client connected [id=${socket.id}]`);
  socket.emit("res", socket.id
  );

  socket.on("checkLogin", async ({ token }) => {
    let user = await getUserInfoBytoken(token);
console.log(user._id);
    if (players[user._id])
      if (players[user._id] != socket.id) {
        io.to(players[user._id]).emit("res", {
          data: "Some one use your Id to other device",
          en: "logout",
          status: 1,
        });
      }
    players[user._id] = socket.id;
  });

  //Join Event When Application is Start
  socket.on("join", async ({ token, gameName }) => {
    let user = await getUserInfoBytoken(token);
    console.log("user join is ");
    console.log(user);
    users[socket.id] = gameName;

    if (!user.isActive) {
      io.to(players[user._id]).emit("res", {
        data: "Your Account is blocked please contact Admin",
        en: "logout",
        status: 1,
      });
    }

    console.log("Join call Game name is ", gameName);
    let numbers = await getLastrecord(gameName, user._id);
    let stock = await getStockrecord(gameName, user._id);
   
    let gameData = await getCurrentBetData(gameName, user._id);
    socket.join(gameName);
    socket.emit("res", {
      data: {
        creditPoint: user.creditPoint,
        user: user,
        date:moment().format('YYYY-MM-DD hh:mm:ss'),
        time: new Date().getTime() / 1000 - games[gameName].startTime,
        numbers: numbers.records,
        stock: stock.records,
        x: numbers.x,
        
        gameName,
        gameData,
      },
      en: "join",
      status: 1,
    });
  });

  socket.on("placeBet", async ({ playerId, gameName, position, betPoint }) => {

    const result = await placeBet(playerId, gameName, position, betPoint);
    const placeBetuser = await getUserInfo(playerId);

 const re= await getRandomStock();
 console.log(re);
    console.log(
      playerId,
      gameName,
      "  :  ",
      position,
      " Bet Point :  ",
      betPoint
    );
    //console.log("result::",result);
   
    socket.emit("res", {
      data: {
        handId: result,
        creditPoint: placeBetuser.creditPoint,
        user: placeBetuser,
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

  // if (new Date().getTime() / 1000 > games.rouletteTimer40.startTime + 53) {
  //   getResult("rouletteTimer40", 36);
  // }
  // if (new Date().getTime() / 1000 > games.spinToWin.startTime + 60) {
  //   getResult("spinToWin", 9);
  // }
  // if (new Date().getTime() / 1000 > games.rouletteTimer60.startTime + 73) {
  //   getResult("rouletteTimer60", 36);
  // }
  if (new Date().getTime() / 1000 > games.stockskill.startTime + 73) {
    getResult("stockskill", 100);
  }

  //}
}, 1000);

getResult = async (gameName, stopNum) => {
  console.log("game result call t:")
  games[gameName].startTime = new Date().getTime() / 1000;

 const re= await getRandomStock();
  io.in(gameName).emit("res", {
    data: {
      gameName,
      data:re,
     
    },
    en: "result",
    status: 1,
  });
  const x=4;

  // if (games[gameName].position[result])
  //   games[gameName].adminBalance -= games[gameName].position[result];

  await addGameResult(gameName, re, x, winningPercent[gameName]);

  // Pay Out of the winners
 // await payTransaction(gameName, result);
  flushAll(gameName);
};

payTransaction = async (gameName, result) => {
  console.log(
    "&&&&&&&&&&&&&&&&&&&&payTransaction&&&&&&&&&&&&&&&&&&&&&&&&",
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

 playSpinToWin = (gameName, position, result) => {
  
  try {
  //  console.log(position);
    const parsedData =position; //JSON.parse(position);

    parsedData.forEach(position => {
      const posNumber = position.number;
     // console.log("posNumber", posNumber);
      const posPrice = parseFloat(position.price);

      games[gameName].position = immutable.update(
        games[gameName].position,
        [posNumber],
        v => (v ? v + posPrice * 100 : posPrice * 100)
      );

      transactions[gameName] = immutable.update(
        transactions[gameName],
        [posNumber, result],
        v => (v ? v + posPrice * 100 : posPrice * 100)
      );
    });
  } catch (error) {
    console.error('Error parsing JSON data:', error);
  }
 };