const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

const ADDRESSES = {
  whitelist: "0xc925AFD72a19ae3D4a04A558230095A327236A0e",
  propertyToken: "0x225d0Cb76ce12eE6e5E66257c78F06D56C866E98",
  paymentToken: "0x05A21030E6627710D3aFE0Ec7424517f10D3de96",
  registry: "0x990f68A3e7FDB3Fe5D96E2736AF06E156eB1252A",
  settlement: "0xa5aa2CA0c4A2732213219F6c7aCF023Db4E8C2Ab",
};

const ASSET_ID = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("RWA-VILLA-001")
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitTx(label, txPromise) {
  const tx = await txPromise;
  console.log(`${label}: ${tx.hash}`);

  const receipt = await ethers.provider.waitForTransaction(
    tx.hash,
    1,
    120000
  );

  if (!receipt) {
    throw new Error(`${label} did not confirm within 120 seconds: ${tx.hash}`);
  }

  console.log(`${label}: confirmed in block ${receipt.blockNumber}`);
  return receipt;
}

async function main() {
  const [admin] = await ethers.getSigners();
  const seller = admin;
  const buyer = process.env.BUYER_ADDRESS;

  if (!buyer || !ethers.utils.isAddress(buyer)) {
    throw new Error("BUYER_ADDRESS is missing or invalid in .env");
  }

  const network = await ethers.provider.getNetwork();
  const balance = await admin.getBalance();

  const latestNonce = await ethers.provider.getTransactionCount(
    admin.address,
    "latest"
  );

  const pendingNonce = await ethers.provider.getTransactionCount(
    admin.address,
    "pending"
  );

  console.log("\n=== SEPOLIA RESUME ===");
  console.log("Chain ID       :", network.chainId);
  console.log("Admin/Seller   :", admin.address);
  console.log("Buyer          :", buyer);
  console.log("Admin balance  :", ethers.utils.formatEther(balance), "ETH");
  console.log("Latest nonce   :", latestNonce);
  console.log("Pending nonce  :", pendingNonce);

  if (pendingNonce > latestNonce) {
    console.log("\nPending transaction detected.");
    console.log("Waiting up to 120 seconds for it to confirm...");

    for (let i = 0; i < 24; i++) {
      await sleep(5000);

      const latest = await ethers.provider.getTransactionCount(
        admin.address,
        "latest"
      );

      const pending = await ethers.provider.getTransactionCount(
        admin.address,
        "pending"
      );

      console.log(`  latest=${latest} pending=${pending}`);

      if (latest === pending) {
        console.log("Pending transaction confirmed.");
        break;
      }

      if (i === 23) {
        throw new Error(
          "A transaction is still pending. Do not redeploy. Check the transaction in MetaMask/Etherscan."
        );
      }
    }
  }

  // Verify deployed contracts exist.
  for (const [name, address] of Object.entries(ADDRESSES)) {
    const code = await ethers.provider.getCode(address);

    if (code === "0x") {
      throw new Error(`${name} contract is missing at ${address}`);
    }

    console.log(`${name}: deployed`);
  }

  const Whitelist = await ethers.getContractAt(
    "Whitelist",
    ADDRESSES.whitelist
  );

  const PropertyToken = await ethers.getContractAt(
    "RestrictedRWAToken",
    ADDRESSES.propertyToken
  );

  const PaymentToken = await ethers.getContractAt(
    "MockPaymentToken",
    ADDRESSES.paymentToken
  );

  const Registry = await ethers.getContractAt(
    "RWARegistry",
    ADDRESSES.registry
  );

  const Settlement = await ethers.getContractAt(
    "RWASettlement",
    ADDRESSES.settlement
  );

  console.log("\n=== CONFIGURING WHITELIST ===");

  await waitTx(
    "Approve seller",
    Whitelist.setApproved(seller.address, true)
  );

  await waitTx(
    "Approve buyer",
    Whitelist.setApproved(buyer, true)
  );

  console.log("\n=== FUNDING PROPERTY ===");

  const targetProperty = ethers.utils.parseUnits("100", 18);
  const sellerProperty = await PropertyToken.balanceOf(seller.address);

  if (sellerProperty.lt(targetProperty)) {
    await waitTx(
      "Mint property",
      PropertyToken.mint(
        seller.address,
        targetProperty.sub(sellerProperty)
      )
    );
  } else {
    console.log(
      "Seller already has",
      ethers.utils.formatUnits(sellerProperty, 18),
      "VILLA425"
    );
  }

  console.log("\n=== FUNDING BUYER ===");

  const targetPayment = ethers.utils.parseUnits("1000", 18);
  const buyerPayment = await PaymentToken.balanceOf(buyer);

  if (buyerPayment.lt(targetPayment)) {
    await waitTx(
      "Mint mUSDC",
      PaymentToken.mint(
        buyer,
        targetPayment.sub(buyerPayment)
      )
    );
  } else {
    console.log(
      "Buyer already has",
      ethers.utils.formatUnits(buyerPayment, 18),
      "mUSDC"
    );
  }

  console.log("\n=== REGISTERING PROPERTY ===");

  const asset = await Registry.getAsset(ASSET_ID);

  if (!asset.active) {
    await waitTx(
      "Register asset",
      Registry.registerAsset(
        ASSET_ID,
        ADDRESSES.propertyToken,
        seller.address,
        "https://example.com/metadata/rwa-villa-001.json"
      )
    );
  } else {
    console.log("Property already registered.");
  }

  console.log("\n=== SELLER APPROVAL ===");

  const sellAmount = ethers.utils.parseUnits("100", 18);

  const allowance = await PropertyToken.allowance(
    seller.address,
    ADDRESSES.settlement
  );

  if (allowance.lt(sellAmount)) {
    await waitTx(
      "Approve settlement",
      PropertyToken.approve(
        ADDRESSES.settlement,
        sellAmount
      )
    );
  } else {
    console.log("Settlement already approved.");
  }

  const deployment = {
    chainId: Number(network.chainId),
    admin: admin.address,
    seller: seller.address,
    buyer,
    whitelist: ADDRESSES.whitelist,
    propertyToken: ADDRESSES.propertyToken,
    paymentToken: ADDRESSES.paymentToken,
    registry: ADDRESSES.registry,
    settlement: ADDRESSES.settlement,
    assetId: ASSET_ID
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

  console.log("\n=== SEPOLIA DEMO READY ===");
  console.log(JSON.stringify(deployment, null, 2));

  console.log("\n=== BALANCES ===");

  console.log(
    "Seller VILLA425:",
    ethers.utils.formatUnits(
      await PropertyToken.balanceOf(seller.address),
      18
    )
  );

  console.log(
    "Buyer VILLA425:",
    ethers.utils.formatUnits(
      await PropertyToken.balanceOf(buyer),
      18
    )
  );

  console.log(
    "Buyer mUSDC:",
    ethers.utils.formatUnits(
      await PaymentToken.balanceOf(buyer),
      18
    )
  );
}

main().catch((error) => {
  console.error("\nERROR:", error);
  process.exitCode = 1;
});
