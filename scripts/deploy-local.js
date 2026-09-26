const { ethers } = require("hardhat");

async function main() {
  const [admin, seller, buyer] = await ethers.getSigners();

  console.log("\n=== LOCAL ACCOUNTS ===");
  console.log("Admin :", admin.address);
  console.log("Seller:", seller.address);
  console.log("Buyer :", buyer.address);

  console.log("\n=== DEPLOYING WHITELIST ===");
  const Whitelist = await ethers.getContractFactory("Whitelist");
  const whitelist = await Whitelist.deploy(admin.address);
  await whitelist.deployed();
  console.log("Whitelist:", whitelist.address);

  console.log("\n=== DEPLOYING PROPERTY TOKEN ===");
  const RestrictedRWAToken =
    await ethers.getContractFactory("RestrictedRWAToken");

  const assetId = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("RWA-VILLA-001")
  );

  const propertyToken = await RestrictedRWAToken.deploy(
    "Beverly Hills Villa Token",
    "VILLA425",
    assetId,
    admin.address,
    whitelist.address
  );

  await propertyToken.deployed();
  console.log("Property Token:", propertyToken.address);
  console.log("Asset ID:", assetId);

  console.log("\n=== DEPLOYING PAYMENT TOKEN ===");
  const MockPaymentToken =
    await ethers.getContractFactory("MockPaymentToken");

  const paymentToken = await MockPaymentToken.deploy();
  await paymentToken.deployed();

  console.log("Payment Token:", paymentToken.address);

  console.log("\n=== DEPLOYING REGISTRY ===");
  const RWARegistry = await ethers.getContractFactory("RWARegistry");
  const registry = await RWARegistry.deploy(admin.address);
  await registry.deployed();

  console.log("Registry:", registry.address);

  console.log("\n=== DEPLOYING SETTLEMENT ===");
  const RWASettlement = await ethers.getContractFactory("RWASettlement");
  const settlement = await RWASettlement.deploy(admin.address);
  await settlement.deployed();

  console.log("Settlement:", settlement.address);

  console.log("\n=== WHITELISTING SELLER + BUYER ===");
  await (await whitelist.setApproved(seller.address, true)).wait();
  await (await whitelist.setApproved(buyer.address, true)).wait();

  console.log("Seller approved");
  console.log("Buyer approved");

  console.log("\n=== MINTING PROPERTY TOKENS ===");
  const assetAmount = ethers.utils.parseUnits("100", 18);

  await (
    await propertyToken.mint(seller.address, assetAmount)
  ).wait();

  console.log(
    "Seller property balance:",
    ethers.utils.formatUnits(
      await propertyToken.balanceOf(seller.address),
      18
    )
  );

  console.log("\n=== MINTING PAYMENT TOKENS ===");
  const paymentAmount = ethers.utils.parseUnits("1000", 18);

  await (
    await paymentToken.mint(buyer.address, paymentAmount)
  ).wait();

  console.log(
    "Buyer payment balance:",
    ethers.utils.formatUnits(
      await paymentToken.balanceOf(buyer.address),
      18
    )
  );

  console.log("\n=== REGISTERING PROPERTY ===");

  await (
    await registry.registerAsset(
      assetId,
      propertyToken.address,
      seller.address,
      "https://example.com/metadata/rwa-villa-001.json"
    )
  ).wait();

  const registered = await registry.getAsset(assetId);

  console.log("Registered asset:");
  console.log("  ID       :", registered.id);
  console.log("  Token    :", registered.token);
  console.log("  Custodian:", registered.custodian);
  console.log("  Metadata :", registered.metadataURI);
  console.log("  Active   :", registered.active);

  console.log("\n=== CREATING TRADE ===");

  const tradeAssetAmount = ethers.utils.parseUnits("10", 18);
  const tradePaymentAmount = ethers.utils.parseUnits("100", 18);

  const tx = await settlement.createTrade(
    buyer.address,
    seller.address,
    propertyToken.address,
    tradeAssetAmount,
    paymentToken.address,
    tradePaymentAmount
  );

  await tx.wait();

  const tradeId = 0;

  console.log("Trade ID:", tradeId);

  console.log("\n=== APPROVING SETTLEMENT ===");

  await (
    await propertyToken
      .connect(seller)
      .approve(settlement.address, tradeAssetAmount)
  ).wait();

  await (
    await paymentToken
      .connect(buyer)
      .approve(settlement.address, tradePaymentAmount)
  ).wait();

  console.log("Seller approved property tokens");
  console.log("Buyer approved payment tokens");

  console.log("\n=== BALANCES BEFORE SETTLEMENT ===");

  console.log(
    "Seller property:",
    ethers.utils.formatUnits(
      await propertyToken.balanceOf(seller.address),
      18
    )
  );

  console.log(
    "Buyer property:",
    ethers.utils.formatUnits(
      await propertyToken.balanceOf(buyer.address),
      18
    )
  );

  console.log(
    "Buyer payment:",
    ethers.utils.formatUnits(
      await paymentToken.balanceOf(buyer.address),
      18
    )
  );

  console.log(
    "Seller payment:",
    ethers.utils.formatUnits(
      await paymentToken.balanceOf(seller.address),
      18
    )
  );

  console.log("\n=== SETTLING TRADE ===");

  await (await settlement.settle(tradeId)).wait();

  console.log("Trade settled successfully");

  console.log("\n=== BALANCES AFTER SETTLEMENT ===");

  console.log(
    "Seller property:",
    ethers.utils.formatUnits(
      await propertyToken.balanceOf(seller.address),
      18
    )
  );

  console.log(
    "Buyer property:",
    ethers.utils.formatUnits(
      await propertyToken.balanceOf(buyer.address),
      18
    )
  );

  console.log(
    "Buyer payment:",
    ethers.utils.formatUnits(
      await paymentToken.balanceOf(buyer.address),
      18
    )
  );

  console.log(
    "Seller payment:",
    ethers.utils.formatUnits(
      await paymentToken.balanceOf(seller.address),
      18
    )
  );

  console.log("\n=== DEPLOYMENT COMPLETE ===");

  console.log(JSON.stringify({
    whitelist: whitelist.address,
    propertyToken: propertyToken.address,
    paymentToken: paymentToken.address,
    registry: registry.address,
    settlement: settlement.address,
    assetId
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
