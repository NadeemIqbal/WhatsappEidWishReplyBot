// const app = require("express")();
// const http = require("http").createServer(app);
// const bodyParser = require("body-parser");
// var cors = require("cors");
// const { Server } = require("socket.io");
// const io = new Server(http);

// var events = require('events');

// //create an object of EventEmitter class by using above reference
// var em = new events.EventEmitter();

// const express = require("express");
// const {venom} = require('../Whatsapp bot/venom-config');
const venom = require("venom-bot");
const { timeStamp } = require("console");

// var corsOptions = {
//   origin: "*",
//   //methods: ["GET", "POST", "PUT"],
//   credentials: true,
// };

// app.use(cors(corsOptions));
// app.use(express.static(__dirname + "/img"));
// app.use(bodyParser.urlencoded({ extended: false })); // we are not dealing with complex object so extended : false
// app.use(bodyParser.json());

venom
  .create({
    session: "eid_wisher_bot", //name of session
    multidevice: true, // for version not multidevice use false.(default: true),
    catchQR: (base64Qrimg, asciiQR) => {
      //   console.log("Number of attempts to read the qrcode: ", attempts);
      //   console.log("Terminal qrcode: ", asciiQR);
      //   console.log("base64 image string qrcode: ", base64Qrimg);
      //   console.log("urlCode (data-ref): ", urlCode);
      //   console.log("NEW QR CODE GENERATED"); // Optional to log the QR in the terminal
      var matches = base64Qrimg.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

      if (matches.length !== 3) {
        return new Error("Invalid input string");
      }
      response.type = matches[1];
      response.data = new Buffer.from(matches[2], "base64");

      var imageBuffer = response;
      require("fs").writeFile(
        "img/out.png",
        imageBuffer["data"],
        "binary",
        function (err) {
          if (err != null) {
            console.log(err);
          } else {
            console.log("New QR CODE");
            // refreshState();
          }
        }
      );
    },
    statusFind: (statusSession, session) => {
      if (statusSession == "qrReadSuccess") {
        console.log("HELLO WORLD");
        // io.emit('scanned_qr_success')
      }
    },
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  console.log("EID WISHER BOT ", client);

  const newMsgs = getAllNewMsgs()
    .then((res) => {
      for (let i = 0; i < res.length; i++) {
        if (i < 20)
          if (res[i].isGroup == false && !isAlreadyWished(res[i])) {
            sendMessageToWhatsapp(
              res[i].lastReceivedKey.remote._serialized,
              "Khair Mubarak!"
            );
            // client.sendSeen(res[i].id);
            // console.log("Seen Sent:", res[i].id);
          }
      }
    })
    .catch((err) => {
      console.log("found error");
    });

  function isAlreadyWished(msg) {
    if (
      // msg.lastReceivedKey.fromMe == false && // last msg in this chat is not from me
      haveIWishedInLastXDays(msg, 1) // no wish msg from me in this chat in last 1 day
    ) {
      console.log("ALREADY WISHED: ", msg.lastReceivedKey.remote._serialized);
      return true;
    }

    console.log("NOT ALREADY WISHED: ", msg.lastReceivedKey.remote._serialized);
    return false;
  }

  function haveIWishedInLastXDays(msg, days) {
    console.log("message id ", msg.id._serialized);

    const dateOneDayBefore =
      new Date().setDate(new Date().getDate() - days) / 1000;

    console.log("dateOneDayBefore ", dateOneDayBefore);

    client
      .getAllMessagesInChat(msg.id._serialized)
      .then((result) => {
        console.log("ALL MESSAGES OF CHAT: ", result);

        // filtering results here to number of days
        for (let i = 0; i < result.length; i++) {
          if (result[i].timestamp > dateOneDayBefore) {
            // msg is from last 1 day
            if (result[i].body.toUpperCase().includes("KHAIR MUBARAK")) {
              console.log(
                "KHAIR MUBARAK FOUND, so skipping this chat: ",
                msg.name
              );
              return true;
            }
          }
        }
        return false;
      })
      .catch((err) => {
        console.log("error retrieving messages :: ", err);
        return false;
      });
  }

  client.onMessage((message) => {
    console.log("Message: ", message);
    if (
      message.body.toUpperCase().includes("EID MUBARAK") ||
      message.body.toUpperCase().includes("EID MUBARIK") ||
      message.body.toUpperCase().includes("MUBARIK EID") ||
      message.body.toUpperCase().includes("MUBARAK EID") ||
      message.body.toUpperCase().includes("EID UL ADHA MUBARAK") ||
      message.body.toUpperCase().includes("EID UL ADHA MUBARIK") ||
      message.body.toUpperCase().includes("EID UL AZHA MUBARIK") ||
      message.body.toUpperCase().includes("EID UL AZHA MUBARAK") ||
      message.body.toUpperCase().includes("عید مبارک") ||
      message.body.toUpperCase().includes("عید الاضحی مبارک") ||
      message.body.toUpperCase().includes("بکرہ عید مبارک") ||
      message.body.toUpperCase().includes("بکرا عید مبارک") ||
      message.body.toUpperCase().includes("بڑی عید مبارک") ||
      tryToExtractEidWishes(message.body)
    ) {
      sendMessageToWhatsapp(message.from, "Khair Mubarak!");
    }
  });

  client.onAnyMessage((message) => {
    console.log("Any Message: ", message);
  });

  function sendMessageToWhatsapp(to, messageBody) {
    client
      .sendText(to, messageBody)
      .then((result) => {
        console.log("Testing");
        console.log("Message Send Result: ", result); //return object success
      })
      .catch((erro) => {
        console.error("Error when sending: ", erro); //return object error
      });
  }

  function tryToExtractEidWishes(message) {
    var wishes = message.split(" ");
    var wish = "";
    for (var i = 0; i < wishes.length; i++) {
      if (
        wishes[i].toUpperCase().includes("EID") ||
        wishes[i].toUpperCase().includes("عید")
      ) {
        wish = wishes[i];
        break;
      }
      if (
        wishes[i].toUpperCase().includes("MUBARAK") ||
        wishes[i].toUpperCase().includes("مبارک")
      ) {
        wish = wishes[i];
        break;
      }
    }
    if (wish.length > 0) {
      console.log("Wish: ", wish);
      return true;
    }
    return false;
  }

  async function getAllNewMsgs() {
    return await client.getAllChats();
  }
}
