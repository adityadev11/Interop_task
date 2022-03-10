const mongoose = require("mongoose");
const ethers = require("ethers");
require("dotenv").config();
const url = process.env.DB_URL;
resultDict = {};
decimalDict = {};
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
              resultDict[symbol] = {
                USD: 0,
                Wei: BigInt(0),
                tokenAmountInDecimals: "",
              };
              decimalDict[symbol] =
                result[i].positionInfo[0].supply[j].decimals;
            }
            resultDict[symbol].USD += Number(feesInUSD);
            resultDict[symbol].Wei += BigInt(fees);
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
              resultDict[symbol] = {
                USD: 0,
                Wei: BigInt(0),
                tokenAmountInDecimals: "",
              };
              decimalDict[symbol] =
                result[i].positionInfo[0].withdraw[j].decimals;
            }
            resultDict[symbol].USD += Number(feesInUSD);
            resultDict[symbol].Wei += BigInt(fees);
          }
        }
      }
    }
  }
  for (key in resultDict) {
    var dec = decimalDict[key];
    resultDict[key].USD = resultDict[key].USD.toString();
    resultDict[key].Wei = resultDict[key].Wei.toString();
    var bigNumWei = ethers.BigNumber.from(resultDict[key].Wei);
    resultDict[key].tokenAmountInDecimals = ethers.utils.formatUnits(
      bigNumWei,
      dec
    );
  }
  //console.log(decimalDict);
  console.log(resultDict);
  con.close();
});
