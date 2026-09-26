const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

async function main() {
  const [admin] = await ethers.getSigners();

  const buyer = process.env.BUYER_ADDRESS;
  if (!buyer || !ethers.utils.isAddress(buyer)) {
    throw new Error("Set a valid BUYER_ADDRESS in .env");
  }

  if (buyer.toLowerCase() === admin.address.toLowerCase()) {
    throw new Error("BUYER_ADDRESS must be different from deployer/seller");
  }

  const network = await ethers.provider.getNetwork();
  const seller = admin;

  console.log("\n=== SEPOLIA DEMO DEPLOYMENT ===");
  console.log("Network :", network.chainId);
  console.log("Admin   :", admin.address);
  console.log("Seller  :", seller.address);
  console.log("Buyer   :", buyer);

  const Whitelist = await ethers.getContractFactory("Whitelist");
  const whitelist = await Whitelist.deploy(admin.address);
  await whitelist.deployed();

  const assetId = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("RWA-VILLA-001")
  );

  const RestrictedRWAToken =
    await ethers.getContractFactory("RestrictedRWAToken");

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

  console.log("\n=== CONTRACTS ===");
  console.log("Whitelist      :", whitelist.address);
  console.log("Property Token :", propertyToken.address);
  console.log("Payment Token  :", paymentToken.address);
  console.log("Registry       :", registry.address);
  console.log("Settlement     :", settlement.address);

  await (await whitelist.setApproved(seller.address, true)).wait();
  await (await whitelist.setApproved(buyer, true)).wait();

  const propertyAmount = ethers.utils.parseUnits("100", 18);
  const paymentAmount = ethers.utils.parseUnits("1000", 18);

  await (
    await propertyToken.mint(
      seller.address,
      propertyAmount
    )
  ).wait();

  await (
    await paymentToken.mint(
      buyer,
      paymentAmount
    )
  ).wait();

  await (
    await registry.registerAsset(
      assetId,
      propertyToken.address,
      seller.address,
      "https://example.com/metadata/rwa-villa-001.json"
    )
  ).wait();

  await (
    await propertyToken
      .connect(seller)
      .approve(
        settlement.address,
        propertyAmount
      )
  ).wait();

  const deployment = {
    chainId: Number(network.chainId),
    admin: admin.address,
    seller: seller.address,
    buyer,
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
    `export const DEPLOYMENT = ${JSON.stringify(
      deployment,
      null,
      2
    )};\n`
  );

  console.log("\n=== DEMO READY ===");
  console.log(JSON.stringify(deployment, null, 2));

  console.log("\nSeller VILLA425:",
    ethers.utils.formatUnits(
      await propertyToken.balanceOf(seller.address),
      18
    )
  );

  console.log("Buyer VILLA425:",
    ethers.utils.formatUnits(
      await propertyToken.balanceOf(buyer),
      18
    )
  );

  console.log("Buyer mUSDC:",
    ethers.utils.formatUnits(
      await paymentToken.balanceOf(buyer),
      18
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
