const mongoose = require("mongoose");
require("dotenv").config();
const url = process.env.DB_URL;

mongoose.connect(url);
const con = mongoose.connection;

con.on("open", async () => {
  console.log("Connected!");
  var transactionSchema = mongoose.Schema({
    positionInfo: Array,
  });
  var transactionModel = mongoose.model("transactions", transactionSchema);

  //const result = await transactionModel.find({}).select("positonInfo");
  const result = await transactionModel.find({});
  console.log(result.length);
  for (var i = 0; i < result.length; i++) {
    if (result[i].positionInfo.length) {
      //console.log(result[i].positionInfo);

      if (result[i].positionInfo[0].supply.length) {
        var supLen = result[i].positionInfo[0].supply.length;
        console.log("Index-", i);
        // console.log("Supply length", supLen);
        for (var j = 0; j < supLen; j++) {
          if (result[i].positionInfo[0].supply[j].fees) {
            var symbol = result[i].positionInfo[0].supply[j].symbol;
            var fees = result[i].positionInfo[0].supply[j].fees;
            var feesInUSD = result[i].positionInfo[0].supply[j].feesInUSD;
            // console.log(symbol);
            // console.log(fees);
            // console.log(feesInUSD);
            var outerDict = {};
            var innerDict = {};
            innerDict["USD"] = feesInUSD;
            innerDict["Wei"] = fees;
            outerDict[symbol] = innerDict;
            console.log(outerDict);
          }
        }
      }
    }
  }

  con.close();
});
