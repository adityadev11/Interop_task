const mongoose = require("mongoose");
const ethers = require("ethers");
require("dotenv").config();
const url = process.env.DB_URL;
mongoose.connect(url);
const con = mongoose.connection;
resultMapping = {};

con.on("open", async () => {
  console.log("Connected!");
  var transactionSchema = mongoose.Schema({
    positionInfo: Array, //Only PositionInfo parameter is being used, hence defined in Schema
  });
  var transactionModel = mongoose.model("transactions", transactionSchema);
  const resultSupply = await transactionModel.aggregate([
    {
      $project: { positionInfo: { supply: 1 } },
    },
    {
      $unwind: "$positionInfo.supply",
    },
    {
      $group: {
        _id: "$positionInfo.supply.symbol",
        USD: { $sum: { $toDecimal: "$positionInfo.supply.feesInUSD" } },
        Wei: { $sum: { $toDecimal: "$positionInfo.supply.fees" } },
        Decimal: { $avg: "$positionInfo.supply.decimals" },
      },
    },
  ]);

  for (var i = 0; i < resultSupply.length; i++) {
    resultMapping[resultSupply[i]._id] = {
      USD: Number(resultSupply[i].USD),
      Wei: BigInt(resultSupply[i].Wei),
      Decimal: Number(resultSupply[i].Decimal),
    };
  }
  const resultWithdraw = await transactionModel.aggregate([
    {
      $project: { positionInfo: { withdraw: 1 } },
    },
    {
      $unwind: "$positionInfo.withdraw",
    },
    {
      $group: {
        _id: "$positionInfo.withdraw.symbol",
        USD: { $sum: { $toDecimal: "$positionInfo.withdraw.feesInUSD" } },
        Wei: { $sum: { $toDecimal: "$positionInfo.withdraw.fees" } },
      },
    },
  ]);

  for (var i = 0; i < resultWithdraw.length; i++) {
    resultMapping[resultWithdraw[i]._id].USD += Number(resultWithdraw[i].USD);
    resultMapping[resultWithdraw[i]._id].Wei += BigInt(resultWithdraw[i].Wei);
  }
  for (key in resultMapping) {
    resultMapping[key].USD = resultMapping[key].USD.toString();
    resultMapping[key].Wei = resultMapping[key].Wei.toString();
    var bigNumWei = ethers.BigNumber.from(resultMapping[key].Wei);
    resultMapping[key].tokenAmountInDecimals = ethers.utils.formatUnits(
      bigNumWei,
      resultMapping[key].Decimal
    );
  }
  console.log(resultMapping);
  con.close();
});
