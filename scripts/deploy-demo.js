const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
  const [admin, seller, buyer] = await ethers.getSigners();

  console.log("\n=== ACCOUNTS ===");
  console.log("Admin :", admin.address);
  console.log("Seller:", seller.address);
  console.log("Buyer :", buyer.address);

  const Whitelist = await ethers.getContractFactory("Whitelist");
  const whitelist = await Whitelist.deploy(admin.address);
  await whitelist.deployed();

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

  const MockPaymentToken =
    await ethers.getContractFactory("MockPaymentToken");

  const paymentToken = await MockPaymentToken.deploy();
  await paymentToken.deployed();

  const RWARegistry = await ethers.getContractFactory("RWARegistry");
  const registry = await RWARegistry.deploy(admin.address);
  await registry.deployed();

  const RWASettlement =
    await ethers.getContractFactory("RWASettlement");

  const settlement = await RWASettlement.deploy(admin.address);
  await settlement.deployed();

  // Whitelist seller and buyer.
  await (await whitelist.setApproved(seller.address, true)).wait();
  await (await whitelist.setApproved(buyer.address, true)).wait();

  // Give seller 100 property tokens.
  const propertyAmount = ethers.utils.parseUnits("100", 18);

  await (
    await propertyToken.mint(
      seller.address,
      propertyAmount
    )
  ).wait();

  // Give buyer 1000 demo payment tokens.
  const paymentBalance = ethers.utils.parseUnits("1000", 18);

  await (
    await paymentToken.mint(
      buyer.address,
      paymentBalance
    )
  ).wait();

  // Register property.
  await (
    await registry.registerAsset(
      assetId,
      propertyToken.address,
      seller.address,
      "https://example.com/metadata/rwa-villa-001.json"
    )
  ).wait();

  // Seller authorizes settlement contract to sell property tokens.
  await (
    await propertyToken
      .connect(seller)
      .approve(settlement.address, propertyAmount)
  ).wait();

  const deployment = {
    chainId: 31337,
    admin: admin.address,
    seller: seller.address,
    buyer: buyer.address,
    whitelist: whitelist.address,
    propertyToken: propertyToken.address,
    paymentToken: paymentToken.address,
    registry: registry.address,
    settlement: settlement.address,
    assetId
  };

  const outputPath = path.join(
    __dirname,
    "..",
    "src",
    "web3",
    "deployment.js"
  );

  fs.writeFileSync(
    outputPath,
    `export const DEPLOYMENT = ${JSON.stringify(deployment, null, 2)};\n`
  );

  console.log("\n=== DEMO READY ===");
  console.log(JSON.stringify(deployment, null, 2));

  console.log("\nBuyer balances:");
  console.log(
    "VILLA425:",
    ethers.utils.formatUnits(
      await propertyToken.balanceOf(buyer.address),
      18
    )
  );

  console.log(
    "mUSDC:",
    ethers.utils.formatUnits(
      await paymentToken.balanceOf(buyer.address),
      18
    )
  );

  console.log("\nSeller property balance:");
  console.log(
    ethers.utils.formatUnits(
      await propertyToken.balanceOf(seller.address),
      18
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
