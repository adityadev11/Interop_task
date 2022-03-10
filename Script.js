const mongoose = require("mongoose");
require("dotenv").config();
const url = process.env.DB_URL;
var feessum = BigInt(0);
var feesUSDsum = Number(0);
resultDict = {};
mongoose.connect(url);
const con = mongoose.connection;

con.on("open", async () => {
  console.log("Connected!");
  var transactionSchema = mongoose.Schema({
    positionInfo: Array,
  });
  var transactionModel = mongoose.model("transactions", transactionSchema);

  const result = await transactionModel.find({});
  //console.log(result.length);
  for (var i = 0; i < result.length; i++) {
    if (result[i].positionInfo.length) {
      if (result[i].positionInfo[0].supply.length) {
        var supLen = result[i].positionInfo[0].supply.length;
        //console.log("Index-", i);
        for (var j = 0; j < supLen; j++) {
          if (result[i].positionInfo[0].supply[j].fees) {
            var symbol = result[i].positionInfo[0].supply[j].symbol;
            var fees = result[i].positionInfo[0].supply[j].fees;
            var feesInUSD = result[i].positionInfo[0].supply[j].feesInUSD;
            if (!(symbol in resultDict)) {
              resultDict[symbol] = { USD: 0, Wei: BigInt(0) };
            }
            resultDict[symbol].USD += Number(feesInUSD);
            resultDict[symbol].Wei += BigInt(fees);
            // console.log(symbol);
            // console.log(fees);
            // console.log(feesInUSD);
            // console.log(resultDict);
          }
        }
      }
      if (result[i].positionInfo[0].withdraw.length) {
        var withdrawLen = result[i].positionInfo[0].withdraw.length;
        //console.log("Index-", i);
        for (var j = 0; j < withdrawLen; j++) {
          if (result[i].positionInfo[0].withdraw[j].fees) {
            var symbol = result[i].positionInfo[0].withdraw[j].symbol;
            var fees = result[i].positionInfo[0].withdraw[j].fees;
            var feesInUSD = result[i].positionInfo[0].withdraw[j].feesInUSD;
            if (!(symbol in resultDict)) {
              resultDict[symbol] = { USD: 0, Wei: BigInt(0) };
            }
            resultDict[symbol].USD += Number(feesInUSD);
            resultDict[symbol].Wei += BigInt(fees);
          }
        }
      }
    }
  }
  for (key in resultDict) {
    resultDict[key].USD = resultDict[key].USD.toString();
    resultDict[key].Wei = resultDict[key].Wei.toString();
  }
  console.log(resultDict);

  con.close();
});
