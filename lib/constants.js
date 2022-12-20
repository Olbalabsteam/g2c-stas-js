require("dotenv").config();
const feeSettings = {
  Sats: parseInt(process.env.SATS),
  PerByte: parseInt(process.env.PERBYTE),
};

module.exports = feeSettings;
