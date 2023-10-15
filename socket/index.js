const { io } = require("../server");
const { getUserInfoBytoken, getUserInfo } = require("./utils/users");
const {
  placeBet,
  winGamePay,
  getAdminPer,
  addGameResult,
  getLastrecord,
  getDetails,
  getStockrecord,
  getCurrentBetData,
  getRandomStock,
  getReprint,
  getHotCold,
  getCancelBet,
  getActivemarket,
} = require("./utils/bet");
const immutable = require("object-path-immutable");
var _ = require("lodash");
var moment = require('moment');


let games = {
  
  stockskill: {
    startTime: new Date().getTime() / 1000,
    position: {},
    adminBalance: 0,
    hot: [],
    cold: [],
  },
  
};
console.log("game start time -------------->:", games["stockskill"].startTime);
console.log("===="+moment().format('YYYY-MM-DD hh:mm:ss'));
let currentDate = new Date().toDateString();
let dailyCount = 1;
function resetDailyCounter() {
  const today = new Date().toDateString();
  if (today !== currentDate) {
    currentDate = today;
    dailyCount = 1;
  }
}
let gamestate = 0;
console.log("8888*************dailyCount: ", dailyCount);
// Function to increment the daily counter
function incrementDailyCounter() {
  console.log("8888************* incrementDailyCounter dailyCount: ", dailyCount);
  resetDailyCounter();
  dailyCount++;
  return dailyCount;
}
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

  socket.on("getnew", async ({ token }) => {
    gameName="stockskill";
    let user = await getUserInfoBytoken(token);
    let numbers = await getLastrecord(gameName, user._id);
    let stock = await getStockrecord(gameName, user._id);
    socket.emit("res", {
      data: {
        creditPoint: user.creditPoint,
        user: user,
        date:moment().format('YYYY-MM-DD hh:mm:ss'),
       
        time: new Date().getTime() / 1000 - games[gameName].startTime,
        starttime: games[gameName].startTime,
        resulttime:games[gameName].startTime+420,
        betclose:games[gameName].startTime+300,
        lastresults: numbers.records,
        stock: stock.records,
        x: dailyCount,
        status:1,
         gstin:"ABCDxyzasfdsa",
         button1:"https://www.google.co.in/?gws_rd=ssl",
         button2:"https://www.google.co.in/?gws_rd=ssl",
         button3:"https://www.google.co.in/?gws_rd=ssl",
         buttontext1:"Privacy Policy",
         buttontext2:"Terms & Conditions",
         buttontext3:"Rules",
        notice:"welcome to Stock Skill , Have a nice day, Thank you",
        
        gameName,
        
      },
      en: "join",
      status: 1,
    });
  });

  //Join Event When Application is Start
  socket.on("join", async ({ token, gameName }) => {

console.log("join call");
    let user = await getUserInfoBytoken(token);
    
    console.log("join call3");
    
        if (players[user._id])
          if (players[user._id] != socket.id) {
            io.to(players[user._id]).emit("res", {
              data: "Some one use your Id to other device",
              en: "logout",
              status: 4,
            });
          }
        players[user._id] = socket.id;
    
    console.log("join call2");
    console.log("user join is ");
    console.log(user);
    users[socket.id] = gameName;

    if (!user.isActive) {
      io.to(players[user._id]).emit("res", {
        data: "Your Account is blocked please contact Admin",
        en: "logout",
        status: 4,
      });
    }

    console.log("Join call Game name is ", gameName);
    let numbers = await getLastrecord(gameName, user._id);
    let stock = await getStockrecord(gameName, user._id);
    let getActive= await getActivemarket();
  //  console.log();
   

    let gameData = await getCurrentBetData(gameName, user._id);
    socket.join(gameName);
    //var resulttime = new Date((ames[gameName].startTime+70) * 1000);
   // var closetime = new Date((ames[gameName].startTime+56) * 1000);
  // let time=new Date().getTime() / 1000 - games[gameName].startTime;
    socket.emit("res", {
      data: {
        market: getActive[0].name,
        gamestate: gamestate,
        isbreak:false,
        breakmsg:"Wait for Next MArket open",
        breaktime:"10:00",
        creditPoint: user.creditPoint,
        user: user,
        date:moment().format('YYYY-MM-DD hh:mm:ss'),
     
        time: new Date().getTime() / 1000 - games[gameName].startTime,
        starttime: games[gameName].startTime,
        resulttime:games[gameName].startTime+420,
        betclose:games[gameName].startTime+300,
        alstresult: numbers.records,
        stock: stock.records,
        x: dailyCount,
        status:1,
        gstin:"ABCDxyzasfdsa",
        button1:"https://www.google.co.in/?gws_rd=ssl",
        button2:"https://www.google.co.in/?gws_rd=ssl",
        button3:"https://www.google.co.in/?gws_rd=ssl",
        buttontext1:"Privacy Policy",
        buttontext2:"Terms & Conditions",
        buttontext3:"Rules",
        notice:"welcome to Stock Skill , Have a nice day, Thank you",
        
        gameName,
        gameData,
      },
      en: "join",
      status: 1,
    });
  });

  socket.on("placeBet", async ({ playerId, gameName, position, betPoint,buckettype }) => {
    let bar=Math.random().toString(36).slice(2);
    
    const result = await placeBet(playerId, gameName, position, betPoint,bar,dailyCount,buckettype);
    const placeBetuser = await getUserInfo(playerId);

 const re= await getRandomStock();

    //console.log("result::",result);
   
    socket.emit("res", {
      data: {
        handId: result,
        creditPoint: placeBetuser.creditPoint,
        user: placeBetuser,
        position:position,
        betPoint:betPoint,
        barcode:bar,
        buckettype:buckettype,
        session:dailyCount,
        gameName,
        result:
          result == 0
            ? "You   don't have sufficient Balance or Error on Place bet"
            : "Place Bet Success",
      },
      en: "placeBet",
      status: 1,
    });
   
   
  });


  socket.on("getDeposit", async ({ token,playerId }) => {

    // const result = await placeBet(playerId, gameName, position, betPoint);
    // const placeBetuser = await getUserInfo(playerId);
 
  //const re= await getRandomStock();
 
     //console.log("result::",result);
    
     socket.emit("res", {
       data: {
        // handId: result,
         qrcode: "https://support.thinkific.com/hc/article_attachments/360042081334/5d37325ea1ff6.png",
         message: "Please Scan the QR code to Deposit",
         upiid:"stockskill@oksbi",
         withdrawal:"Withdrawal Timeing is 3PM to 6PM",
         isDeposit:true,
         isWithdrawal:true,
        
        
       },
       en: "getDeposit",
       status: 1,
     });
    
    
   });

   socket.on("postDeposit", async ({ token,playerId,amount,utrNo}) => {

    // const result = await placeBet(playerId, gameName, position, betPoint);
    // const placeBetuser = await getUserInfo(playerId);
 
  //const re= await getRandomStock();
 
     //console.log("result::",result);
    
     socket.emit("res", {
       data: {
        // handId: result,
         amount: amount,
         utrno: utrNo,
         
        result:"Deposie Request Success"
       },
       en: "postDeposit",
       status: 1,
     });
    
    
   });

   socket.on("postWithdrawal", async ({ token,playerId,amount,comment}) => {

    // const result = await placeBet(playerId, gameName, position, betPoint);
    // const placeBetuser = await getUserInfo(playerId);
 
  //const re= await getRandomStock();
 
     //console.log("result::",result);
    
     socket.emit("res", {
       data: {
        // handId: result,
         amount: amount,
         
        
         
        result:"Withdrawal Request Success"
       },
       en: "postWithdrawal",
       status: 1,
     });
    
    
   });

  socket.on("reward", async ({ playerId,barcode }) => {

   // const result = await placeBet(playerId, gameName, position, betPoint);
    const placeBetuser = await getUserInfo(playerId);

 const re= await getRandomStock();

    //console.log("result::",result);
   
    socket.emit("res", {
      data: {
       // handId: result,
        creditPoint: placeBetuser.creditPoint,
        user: placeBetuser,
        stock:re,
        totalreward:100,
       result:"Success"
      },
      en: "reward",
      status: 1,
    });
   
   
  });
  socket.on("getReprint", async ({ token,handId }) => {
    let user = await getUserInfoBytoken(token);
    // const result = await placeBet(playerId, gameName, position, betPoint);
     //const placeBetuser = await getUserInfo(playerId);
  console.log(user);
   let reprint= await getReprint(user._id,handId);
 //console.log(re);
     console.log("reprint::",reprint[0]);
    
     socket.emit("res", {
       data: {
        // handId: result,
        data:reprint[0],
        result:"Success"
       },
       en: "reprint",
       status: 1,
     });
    
    
   });

   socket.on("getCancelBet", async ({ token,handId,session }) => {
    let user = await getUserInfoBytoken(token);
    // const result = await placeBet(playerId, gameName, position, betPoint);
     //const placeBetuser = await getUserInfo(playerId);
  //console.log(user[0]);

  if(session==dailyCount){
   let cancelbet= await getCancelBet(user._id,handId,dailyCount);
 //console.log(re);
     //console.log("reprint::",cancelbet[0]);
    
     socket.emit("res", {
      data: {
        // handId: result,
        msg:"Order Deleted Suscessfully",
        result:"Success"
       },
       en: "cancelBet",
       status: 1,
     });
     socket.emit("res", {
      data: {
        // handId: result,
        user:user,
        result:"Success"
       },
       en: "balance",
       status: 1,
     });
    
    
  
  }else{
     
    socket.emit("res", {
      data: {
       // handId: result,
       msg:"Session Expired",
       result:"Fail"
      },
      en: "cancelBet",
      status: 1,
    });
  }

});

  socket.on("detail", async ({ startdate,enddate,playerId }) => {

 //   const detail = await getDetails(playerId,startdate,enddate);
   //  const placeBetuser = await getUserInfo(playerId);

 
  //const re= await getRandomStock();
 
     //console.log("result::",result);
    
     socket.emit("res", {
       data: {
         sale: 1000,
         gst:500,
         total:100,
         success:280,
         tds:100,
         grandtotal:1500,
         commision:2000,

        result:"Success"
       },
       en: "detail",
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
let prest={}

setInterval(async () => {
  //console.log("==interwal=="+moment().format('YYYY-MM-DD hh:mm:ss'));
  
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
  const currentTimeInSeconds = new Date().getTime() / 1000;
  const startTime = games.stockskill.startTime;
  if (currentTimeInSeconds == games.stockskill.startTime + 1) {
    //console.log("==start=="+moment().format('YYYY-MM-DD hh:mm:ss'));
   // console.log("==startgametime=="+games.stockskill.startTime);
   
   io.in("stockskill").emit("res", {
      
      en: "game start",
      status: 1,
    });
  }
  const randomOffset = Math.floor(Math.random() * (417 - 401 + 1) + 401);

  if (currentTimeInSeconds >= startTime + randomOffset && currentTimeInSeconds <= startTime + randomOffset+2) {
    // console.log("==betclose=="+moment().format('YYYY-MM-DD hh:mm:ss'));
    // console.log("==betclsode=="+games.stockskill.startTime);
    prest= await getRandomStock();
 
    gamestate = 1;
  getResult("stockskill", 100,1);
    
   }
  if (currentTimeInSeconds >= startTime + 420 && currentTimeInSeconds <= startTime + 421) {
    console.log("==result=="+moment().format('YYYY-MM-DD hh:mm:ss'));
    //console.log("==gametime=="+games.stockskill.startTime);
   gamestate=3;
    getResult("stockskill", 100,2);
  }
  if (currentTimeInSeconds >= startTime + 300 && currentTimeInSeconds <= startTime + 301) {
   // console.log("==betclose=="+moment().format('YYYY-MM-DD hh:mm:ss'));
   // console.log("==betclsode=="+games.stockskill.startTime);
 gamestate = 1;
   
    io.in("stockskill").emit("res", {
     
      en: "bet closed",
      status: 2,
    });
  }

  //}
}, 1000);
getResult = async (gameName, stopNum,pre) => {
  
   if(pre==1)
  {


 io.in(gameName).emit("res", {
  data: {
    gameName,
    data:prest,
   // x:dailyCount,
  },
  en: "preresult",
  status: 2,
});
  }else{
  console.log("game result call t:");
  games[gameName].startTime = new Date().getTime() / 1000;


// const lid= await getResult1();

 io.in(gameName).emit("res", {
    data: {
      gameName,
      data:prest,
      x:dailyCount,
    },
    en: "result",
    status: 3,
  });
   

  // if (games[gameName].position[result])
  //   games[gameName].adminBalance -= games[gameName].position[result];

  await addGameResult(gameName, prest, dailyCount, winningPercent[gameName]);
  incrementDailyCounter();
  // Pay Out of the winners
 // await payTransaction(gameName, result);
  flushAll(gameName);
  
  gamestate=0;
}
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
  prest={};
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