const expect = require("chai").expect;
const utils = require("../../utils/test_utils");
const bsv = require("bsv");
require("dotenv").config();

const {
  contract,
  issue,
  transfer,
  split,
  mergeSplit,
  mergeSplitWithCallback,
  unsignedMergeSplit,
} = require("../../../index");

const { bitcoinToSatoshis, getTransaction, getFundsFromFaucet, broadcast } =
  require("../../../index").utils;

const { sighash } = require("../../../lib/stas");

let issuerPrivateKey;
let fundingPrivateKey;
let contractUtxos;
let fundingUtxos;
let publicKeyHash;
let bobPrivateKey;
let alicePrivateKey;
let bobAddr;
let aliceAddr;
let issueTxid;
let issueTx;
let issueOutFundingVout;
let mergeObj;
const keyMap = new Map();

const bobSignatureCallback = async (tx, i, script, satoshis) => {
  return bsv.Transaction.sighash
    .sign(tx, bobPrivateKey, sighash, i, script, satoshis)
    .toTxFormat()
    .toString("hex");
};
const paymentSignatureCallback = async (tx, i, script, satoshis) => {
  return bsv.Transaction.sighash
    .sign(tx, fundingPrivateKey, sighash, i, script, satoshis)
    .toTxFormat()
    .toString("hex");
};
describe("MergeSplit Functional Tests", () => {
  beforeEach(async () => {
    await setup();
  });

  it.only("MergeSplit - Successful MergeSplit With Fees 1", async () => {
    const aliceAmountSatoshis = bitcoinToSatoshis(issueTx.vout[0].value) / 2;
    const bobAmountSatoshis =
      bitcoinToSatoshis(issueTx.vout[0].value) +
      bitcoinToSatoshis(issueTx.vout[1].value) -
      aliceAmountSatoshis;

    const mergeSplitHex = await mergeSplit(
      alicePrivateKey,
      utils.getMergeSplitUtxoTemp(mergeObj, issueTx, 0, 1),
      aliceAddr,
      aliceAmountSatoshis,
      bobAddr,
      bobAmountSatoshis,
      utils.getUtxo(issueTxid, issueTx, issueOutFundingVout),
      fundingPrivateKey
    );
    const mergeSplitTxid = await broadcast(mergeSplitHex);
    expect(await utils.getVoutAmount(mergeSplitTxid, 0)).to.equal(0.000015);
    expect(await utils.getVoutAmount(mergeSplitTxid, 1)).to.equal(0.000035);
    await utils.isTokenBalance(aliceAddr, 1500);
    await utils.isTokenBalance(bobAddr, 8500);
  });

  it("MergeSplit - Successful MergeSplit With Fees 2", async () => {
    const issueOutFundingVout = issueTx.vout.length - 1;
    const amount1 = bitcoinToSatoshis(issueTx.vout[0].value) / 2;
    const amount2 =
      bitcoinToSatoshis(issueTx.vout[0].value) +
      bitcoinToSatoshis(issueTx.vout[1].value) -
      amount1;

    const mergeSplitHex = await mergeSplit(
      bobPrivateKey,
      utils.getMergeSplitUtxoTemp(mergeObj, issueTx, 2, 3),
      aliceAddr,
      amount1,
      aliceAddr,
      amount2,
      utils.getUtxo(issueTxid, issueTx, issueOutFundingVout),
      fundingPrivateKey
    );
    const mergeSplitTxid = await broadcast(mergeSplitHex);
    expect(await utils.getVoutAmount(mergeSplitTxid, 0)).to.equal(0.000015);
    expect(await utils.getVoutAmount(mergeSplitTxid, 1)).to.equal(0.000035);
    await utils.isTokenBalance(aliceAddr, 10000);
    await utils.isTokenBalance(bobAddr, 0);
  });

  it("MergeSplit - Successful MergeSplit No Fees", async () => {
    const aliceAmountSatoshis = bitcoinToSatoshis(issueTx.vout[0].value) / 2;
    const bobAmountSatoshis =
      bitcoinToSatoshis(issueTx.vout[0].value) +
      bitcoinToSatoshis(issueTx.vout[1].value) -
      aliceAmountSatoshis;

    const mergeSplitHex = await mergeSplit(
      bobPrivateKey,
      utils.getMergeSplitUtxoTemp(mergeObj, issueTx, 2, 3),
      aliceAddr,
      aliceAmountSatoshis,
      bobAddr,
      bobAmountSatoshis,
      null,
      null
    );
    const mergeSplitTxid = await broadcast(mergeSplitHex);
    expect(await utils.getVoutAmount(mergeSplitTxid, 0)).to.equal(0.000015);
    expect(await utils.getVoutAmount(mergeSplitTxid, 1)).to.equal(0.000035);
    await utils.isTokenBalance(aliceAddr, 6500);
    await utils.isTokenBalance(bobAddr, 3500);
  });

  it("MergeSplit - Successful MergeSplit With Callback And Fees", async () => {
    const issueOutFundingVout = issueTx.vout.length - 1;

    const aliceAmountSatoshis = bitcoinToSatoshis(issueTx.vout[0].value) / 2;
    const bobAmountSatoshis =
      bitcoinToSatoshis(issueTx.vout[0].value) +
      bitcoinToSatoshis(issueTx.vout[1].value) -
      aliceAmountSatoshis;

    const mergeSplitHex = await mergeSplitWithCallback(
      bobPrivateKey.publicKey,
      utils.getMergeSplitUtxoTemp(mergeObj, issueTx, 2, 3),
      aliceAddr,
      aliceAmountSatoshis,
      bobAddr,
      bobAmountSatoshis,
      utils.getUtxo(issueTxid, issueTx, issueOutFundingVout),
      fundingPrivateKey.publicKey,
      bobSignatureCallback,
      paymentSignatureCallback
    );
    const mergeSplitTxid = await broadcast(mergeSplitHex);
    expect(await utils.getVoutAmount(mergeSplitTxid, 0)).to.equal(0.000015);
    expect(await utils.getVoutAmount(mergeSplitTxid, 1)).to.equal(0.000035);
    await utils.isTokenBalance(aliceAddr, 6500);
    await utils.isTokenBalance(bobAddr, 3500);
  });

  it("MergeSplit - Successful MergeSplit With Callback No Fees", async () => {
    const aliceAmountSatoshis = bitcoinToSatoshis(issueTx.vout[0].value) / 2;
    const bobAmountSatoshis =
      bitcoinToSatoshis(issueTx.vout[0].value) +
      bitcoinToSatoshis(issueTx.vout[1].value) -
      aliceAmountSatoshis;

    const mergeSplitHex = await mergeSplitWithCallback(
      bobPrivateKey.publicKey,
      utils.getMergeSplitUtxoTemp(mergeObj, issueTx, 2, 3),
      aliceAddr,
      aliceAmountSatoshis,
      bobAddr,
      bobAmountSatoshis,
      null,
      null,
      bobSignatureCallback,
      null
    );
    const mergeSplitTxid = await broadcast(mergeSplitHex);
    expect(await utils.getVoutAmount(mergeSplitTxid, 0)).to.equal(0.000015);
    expect(await utils.getVoutAmount(mergeSplitTxid, 1)).to.equal(0.000035);
    await utils.isTokenBalance(aliceAddr, 6500);
    await utils.isTokenBalance(bobAddr, 3500);
  });

  it("MergeSplit - Successful MergeSplit unsigned With Fees", async () => {
    const issueOutFundingVout = issueTx.vout.length - 1;

    const aliceAmountSatoshis = bitcoinToSatoshis(issueTx.vout[0].value) / 2;
    const bobAmountSatoshis =
      bitcoinToSatoshis(issueTx.vout[0].value) +
      bitcoinToSatoshis(issueTx.vout[1].value) -
      aliceAmountSatoshis;

    const unsignedMergeSplitReturn = await unsignedMergeSplit(
      bobPrivateKey.publicKey,
      utils.getMergeSplitUtxoTemp(mergeObj, issueTx, 2, 3),
      aliceAddr,
      aliceAmountSatoshis,
      bobAddr,
      bobAmountSatoshis,
      utils.getUtxo(issueTxid, issueTx, issueOutFundingVout),
      fundingPrivateKey.publicKey
    );
    const mergeSplitTx = bsv.Transaction(unsignedMergeSplitReturn.hex);
    utils.signScriptWithUnlocking(
      unsignedMergeSplitReturn,
      mergeSplitTx,
      keyMap
    );
    const mergeSplitTxid = await broadcast(mergeSplitTx.serialize(true));
    expect(await utils.getVoutAmount(mergeSplitTxid, 0)).to.equal(0.000015);
    expect(await utils.getVoutAmount(mergeSplitTxid, 1)).to.equal(0.000035);
    await utils.isTokenBalance(aliceAddr, 6500);
    await utils.isTokenBalance(bobAddr, 3500);
  });

  it("MergeSplit - Successful MergeSplit unsigned With No Fees", async () => {
    const aliceAmountSatoshis = bitcoinToSatoshis(issueTx.vout[0].value) / 2;
    const bobAmountSatoshis =
      bitcoinToSatoshis(issueTx.vout[0].value) +
      bitcoinToSatoshis(issueTx.vout[1].value) -
      aliceAmountSatoshis;

    const unsignedMergeSplitReturn = await unsignedMergeSplit(
      bobPrivateKey.publicKey,
      utils.getMergeSplitUtxoTemp(mergeObj, issueTx, 2, 3),
      aliceAddr,
      aliceAmountSatoshis,
      bobAddr,
      bobAmountSatoshis,
      null,
      null
    );
    const mergeSplitTx = bsv.Transaction(unsignedMergeSplitReturn.hex);
    utils.signScriptWithUnlocking(
      unsignedMergeSplitReturn,
      mergeSplitTx,
      keyMap
    );
    const mergeSplitTxid = await broadcast(mergeSplitTx.serialize(true));
    expect(await utils.getVoutAmount(mergeSplitTxid, 0)).to.equal(0.000015);
    expect(await utils.getVoutAmount(mergeSplitTxid, 1)).to.equal(0.000035);
    await utils.isTokenBalance(aliceAddr, 6500);
    await utils.isTokenBalance(bobAddr, 3500);
  });

  it("MergeSplit - Incorrect Split Amount 1", async () => {
    const bobAmount = bitcoinToSatoshis(issueTx.vout[0].value) / 2;
    const mergeSplitHex = await mergeSplit(
      alicePrivateKey,
      utils.getMergeSplitUtxoTemp(mergeObj, issueTx, 0, 1),
      aliceAddr,
      100, // incorrect amount
      bobAddr,
      bobAmount,
      utils.getUtxo(issueTxid, issueTx, issueOutFundingVout),
      fundingPrivateKey
    );
    try {
      await broadcast(mergeSplitHex);
      expect(false).toBeTruthy();
      return;
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.response.data).to.contain(
        "mandatory-script-verify-flag-failed (Script failed an OP_NUMEQUALVERIFY operation)"
      );
    }
  });

  it("MergeSplit - Incorrect Split Amount 2", async () => {
    const aliceAmountSatoshis = bitcoinToSatoshis(issueTx.vout[0].value) / 2;

    const mergeSplitHex = await mergeSplit(
      alicePrivateKey,
      utils.getMergeSplitUtxoTemp(mergeObj, issueTx, 0, 1),
      aliceAddr,
      aliceAmountSatoshis,
      bobAddr,
      100, // incorrect amount
      utils.getUtxo(issueTxid, issueTx, issueOutFundingVout),
      fundingPrivateKey
    );
    try {
      await broadcast(mergeSplitHex);
      expect(false).toBeTruthy();
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.response.data).to.contain(
        "mandatory-script-verify-flag-failed (Script failed an OP_NUMEQUALVERIFY operation)"
      );
    }
  });

  it("MergeSplit - Incorrect Owner Private Key Throws Error", async () => {
    const aliceAmountSatoshis = bitcoinToSatoshis(issueTx.vout[0].value) / 2;
    const bobAmountSatoshis =
      bitcoinToSatoshis(issueTx.vout[0].value) +
      bitcoinToSatoshis(issueTx.vout[1].value) -
      aliceAmountSatoshis;
    const incorrectPrivateKey = bsv.PrivateKey();

    const mergeSplitHex = await mergeSplit(
      incorrectPrivateKey,
      utils.getMergeSplitUtxoTemp(mergeObj, issueTx, 0, 1),
      aliceAddr,
      aliceAmountSatoshis,
      bobAddr,
      bobAmountSatoshis,
      utils.getUtxo(issueTxid, issueTx, issueOutFundingVout),
      fundingPrivateKey
    );
    try {
      await broadcast(mergeSplitHex);
      expect(false).toBeTruthy();
      return;
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.response.data).to.contain(
        "mandatory-script-verify-flag-failed (Script failed an OP_EQUALVERIFY operation)"
      );
    }
  });

  it("MergeSplit - Incorrect Payments Private Key Throws Error", async () => {
    const aliceAmountSatoshis = bitcoinToSatoshis(issueTx.vout[0].value) / 2;
    const bobAmountSatoshis =
      bitcoinToSatoshis(issueTx.vout[0].value) +
      bitcoinToSatoshis(issueTx.vout[1].value) -
      aliceAmountSatoshis;
    const incorrectPrivateKey = bsv.PrivateKey();

    const mergeSplitHex = await mergeSplit(
      issuerPrivateKey,
      utils.getMergeSplitUtxoTemp(mergeObj, issueTx, 0, 1),
      aliceAddr,
      aliceAmountSatoshis,
      bobAddr,
      bobAmountSatoshis,
      utils.getUtxo(issueTxid, issueTx, issueOutFundingVout),
      incorrectPrivateKey
    );
    try {
      await broadcast(mergeSplitHex);
      expect(false).toBeTruthy();
      return;
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.response.data).to.contain(
        "mandatory-script-verify-flag-failed (Script failed an OP_EQUALVERIFY operation)"
      );
    }
  });
});
async function setup() {
  issuerPrivateKey = bsv.PrivateKey();
  keyMap.set(issuerPrivateKey.publicKey, issuerPrivateKey);
  fundingPrivateKey = bsv.PrivateKey();
  keyMap.set(fundingPrivateKey.publicKey, fundingPrivateKey);
  bobPrivateKey = bsv.PrivateKey();
  keyMap.set(bobPrivateKey.publicKey, bobPrivateKey);
  alicePrivateKey = bsv.PrivateKey();
  keyMap.set(alicePrivateKey.publicKey, alicePrivateKey);
  bobAddr = bobPrivateKey.toAddress(process.env.NETWORK).toString();
  aliceAddr = alicePrivateKey.toAddress(process.env.NETWORK).toString();
  contractUtxos = await getFundsFromFaucet(
    issuerPrivateKey.toAddress(process.env.NETWORK).toString()
  );
  fundingUtxos = await getFundsFromFaucet(
    fundingPrivateKey.toAddress(process.env.NETWORK).toString()
  );
  publicKeyHash = bsv.crypto.Hash.sha256ripemd160(
    issuerPrivateKey.publicKey.toBuffer()
  ).toString("hex");
  const symbol = "TAALT";
  const supply = 10000;
  const schema = utils.schema(publicKeyHash, symbol, supply);

  const contractHex = await contract(
    issuerPrivateKey,
    contractUtxos,
    fundingUtxos,
    fundingPrivateKey,
    schema,
    supply
  );
  const contractTxid = await broadcast(contractHex);
  const contractTx = await getTransaction(contractTxid);

  const issueHex = await issue(
    issuerPrivateKey,
    [
      {
        addr: aliceAddr,
        satoshis: 7000,
        data: "one",
      },
      {
        addr: aliceAddr,
        satoshis: 3000,
        data: "two",
      },
      // {
      //   addr: bobAddr,
      //   satoshis: 3000,
      // },
      // {
      //   addr: bobAddr,
      //   satoshis: 2000,
      // },
    ],
    utils.getUtxo(contractTxid, contractTx, 0),
    utils.getUtxo(contractTxid, contractTx, 1),
    fundingPrivateKey,
    true,
    symbol,
    2
  );
  console.log(issueHex);
  issueTxid = await broadcast(issueHex);
  issueTx = await getTransaction(issueTxid);
  issueOutFundingVout = issueTx.vout.length - 1;

  mergeObj = new bsv.Transaction(issueHex);

  // const transferHex = await transfer(
  //   bobPrivateKey,
  //   utils.getUtxo(issueTxid, issueTx, 1),
  //   aliceAddr,
  //   utils.getUtxo(issueTxid, issueTx, issueOutFundingVout),
  //   fundingPrivateKey
  // );
  // const transferTxid = await broadcast(transferHex);
  // const transferTx = await getTransaction(transferTxid);

  // const bobAmount1 = transferTx.vout[0].value / 2;
  // const bobAmount2 = transferTx.vout[0].value - bobAmount1;
  // const splitDestinations = [];
  // splitDestinations[0] = {
  //   address: bobAddr,
  //   satoshis: bitcoinToSatoshis(bobAmount1),
  // };
  // splitDestinations[1] = {
  //   address: bobAddr,
  //   satoshis: bitcoinToSatoshis(bobAmount2),
  // };

  // const splitHex = await split(
  //   alicePrivateKey,
  //   utils.getUtxo(transferTxid, transferTx, 0),
  //   splitDestinations,
  //   utils.getUtxo(transferTxid, transferTx, 1),
  //   fundingPrivateKey
  // );
  // splitTxid = await broadcast(splitHex);
  // splitTx = await getTransaction(splitTxid);
  // splitTxObj = new bsv.Transaction(splitHex);
}
