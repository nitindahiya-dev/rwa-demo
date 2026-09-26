const assert = require("assert");
const { ethers } = require("hardhat");

async function expectRevert(promise) {
  let reverted = false;

  try {
    await promise;
  } catch (error) {
    reverted = true;
  }

  assert.strictEqual(
    reverted,
    true,
    "Expected transaction to revert"
  );
}

describe("RWA Platform", function () {
  let admin;
  let seller;
  let buyer;
  let outsider;

  let whitelist;
  let propertyToken;
  let paymentToken;
  let settlement;

  const propertyAmount =
    ethers.utils.parseUnits("100", 18);

  const paymentAmount =
    ethers.utils.parseUnits("1000", 18);

  beforeEach(async function () {
    [admin, seller, buyer, outsider] =
      await ethers.getSigners();

    const Whitelist =
      await ethers.getContractFactory("Whitelist");

    whitelist =
      await Whitelist.deploy(admin.address);

    await whitelist.deployed();

    const RestrictedRWAToken =
      await ethers.getContractFactory(
        "RestrictedRWAToken"
      );

    const assetId =
      ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes("TEST-ASSET")
      );

    propertyToken =
      await RestrictedRWAToken.deploy(
        "Test Property",
        "TESTRWA",
        assetId,
        admin.address,
        whitelist.address
      );

    await propertyToken.deployed();

    const MockPaymentToken =
      await ethers.getContractFactory(
        "MockPaymentToken"
      );

    paymentToken =
      await MockPaymentToken.deploy();

    await paymentToken.deployed();

    const RWASettlement =
      await ethers.getContractFactory(
        "RWASettlement"
      );

    settlement =
      await RWASettlement.deploy(
        admin.address
      );

    await settlement.deployed();

    await whitelist.setApproved(
      seller.address,
      true
    );

    await whitelist.setApproved(
      buyer.address,
      true
    );

    await propertyToken.mint(
      seller.address,
      propertyAmount
    );

    await paymentToken.mint(
      buyer.address,
      paymentAmount
    );

    await propertyToken
      .connect(seller)
      .approve(
        settlement.address,
        propertyAmount
      );
  });

  it("rejects unapproved RWA recipients", async function () {
    await expectRevert(
      propertyToken.mint(
        outsider.address,
        ethers.utils.parseUnits("1", 18)
      )
    );
  });

  it("completes an investment correctly", async function () {
    const assetAmount =
      ethers.utils.parseUnits("10", 18);

    const tradePayment =
      ethers.utils.parseUnits("100", 18);

    await paymentToken
      .connect(buyer)
      .approve(
        settlement.address,
        tradePayment
      );

    await settlement
      .connect(buyer)
      .buyAsset(
        seller.address,
        propertyToken.address,
        assetAmount,
        paymentToken.address,
        tradePayment
      );

    assert(
      (
        await propertyToken.balanceOf(
          buyer.address
        )
      ).eq(assetAmount)
    );

    assert(
      (
        await propertyToken.balanceOf(
          seller.address
        )
      ).eq(
        propertyAmount.sub(assetAmount)
      )
    );

    assert(
      (
        await paymentToken.balanceOf(
          buyer.address
        )
      ).eq(
        paymentAmount.sub(tradePayment)
      )
    );

    assert(
      (
        await paymentToken.balanceOf(
          seller.address
        )
      ).eq(tradePayment)
    );
  });

  it("records the investment on-chain", async function () {
    const assetAmount =
      ethers.utils.parseUnits("10", 18);

    const tradePayment =
      ethers.utils.parseUnits("100", 18);

    await paymentToken
      .connect(buyer)
      .approve(
        settlement.address,
        tradePayment
      );

    await settlement
      .connect(buyer)
      .buyAsset(
        seller.address,
        propertyToken.address,
        assetAmount,
        paymentToken.address,
        tradePayment
      );

    const nextTradeId =
      await settlement.nextTradeId();

    assert.strictEqual(
      nextTradeId.toString(),
      "1"
    );

    const trade =
      await settlement.trades(0);

    assert.strictEqual(
      trade.buyer,
      buyer.address
    );

    assert.strictEqual(
      trade.seller,
      seller.address
    );

    assert.strictEqual(
      trade.assetToken,
      propertyToken.address
    );

    assert.strictEqual(
      trade.paymentToken,
      paymentToken.address
    );

    assert(
      trade.assetAmount.eq(assetAmount)
    );

    assert(
      trade.paymentAmount.eq(tradePayment)
    );

    assert.strictEqual(
      trade.settled,
      true
    );
  });
});
