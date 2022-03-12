const mongoose = require("mongoose");
const ethers = require("ethers");
require("dotenv").config();
const url = process.env.DB_URL;
resultDict = {}; //Mapping for final result
decimalDict = {}; //Mapping of each token to it's decimals e.g- Eth:18
var TotalUSD = 0;
mongoose.connect(url);
const con = mongoose.connection;

con.on("open", async () => {
  console.log("Connected!");
  var transactionSchema = mongoose.Schema({
    positionInfo: Array, //Only PositionInfo parameter is being used, hence defined in Schema
  });
  var transactionModel = mongoose.model("transactions", transactionSchema);

  const result = await transactionModel.find({}); //Quering the entire database for all entries
  for (var i = 0; i < result.length; i++) {
    //Loop to go through each entry of database
    if (result[i].positionInfo.length) {
      //Check to see if positionInfo Parameter exists
      if (result[i].positionInfo[0].supply.length) {
        //Check to see if Supply parameter exists (inside positionInfo)
        var supLen = result[i].positionInfo[0].supply.length;
        //Length of Supply array
        for (var j = 0; j < supLen; j++) {
          //Iterating through each element in supply array
          if (result[i].positionInfo[0].supply[j].fees) {
            //Check to see if element in Supply array contains 'fees' parameter (some elements doesn't)
            var symbol = result[i].positionInfo[0].supply[j].symbol;
            var fees = result[i].positionInfo[0].supply[j].fees;
            var feesInUSD = result[i].positionInfo[0].supply[j].feesInUSD;
            if (!(symbol in resultDict)) {
              //If Symbol mapping not already instantiated in result mapping,then instantiate it and store it's decimal in token Decimal mapping
              resultDict[symbol] = {
                USD: 0,
                Wei: BigInt(0),
                tokenAmountInDecimals: "",
              };
              decimalDict[symbol] =
                result[i].positionInfo[0].supply[j].decimals;
            }
            resultDict[symbol].USD += Number(feesInUSD); //Add USD and Wei of each supply instance in token result mapping.
            resultDict[symbol].Wei += BigInt(fees);
          }
        }
      }
      //Do Same steps performed in supply for Withdraw
      if (result[i].positionInfo[0].withdraw.length) {
        var withdrawLen = result[i].positionInfo[0].withdraw.length;
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
    TotalUSD += resultDict[key].USD;
    //Iterate through each element in result mapping
    var dec = decimalDict[key];
    //Get the decimal of the token using decimal token mapping
    resultDict[key].USD = resultDict[key].USD.toString();
    resultDict[key].Wei = resultDict[key].Wei.toString(); //Convert USD and Wei parameters to string
    var bigNumWei = ethers.BigNumber.from(resultDict[key].Wei);
    resultDict[key].tokenAmountInDecimals = ethers.utils.formatUnits(
      bigNumWei,
      dec
    ); //Convert Wei to tokenAmountInDecimals by divding wei by 10^decimals of that token
  }
  //console.log(decimalDict);
  console.log(resultDict);
  console.log("Total amount in USD-", TotalUSD);
  con.close();
});
