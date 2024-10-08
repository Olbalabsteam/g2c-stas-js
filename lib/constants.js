//Commented rollup breaking code, uncomment to push to public repo
//require("dotenv").config();
const feeSettings = {
  Sats: 51, //parseInt(process.env.SATS),
  PerByte: 1000, //parseInt(process.env.PERBYTE),
};

module.exports = feeSettings;
