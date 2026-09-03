const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const RPC_URL = process.env.POLYGON_AMOY_RPC || "https://polygon-amoy-bor-rpc.publicnode.com";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const EXPLORER = "https://amoy.polygonscan.com";

const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "ProofRegistry.sol", "ProofRegistry.json");

async function main() {
  if (!PRIVATE_KEY) {
    console.error("DEPLOYER_PRIVATE_KEY not set in .env");
    process.exit(1);
  }

  if (!fs.existsSync(artifactPath)) {
    console.error("Contract not compiled. Run: npx hardhat compile --config hardhat.config.cjs");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  console.log("Connecting to Polygon Amoy...");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} POL`);

  if (balance === 0n) {
    console.error("Insufficient POL for deployment");
    process.exit(1);
  }

  console.log("Deploying ProofRegistry...");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\nContract deployed successfully!`);
  console.log(`Address: ${address}`);
  console.log(`Explorer: ${EXPLORER}/address/${address}`);

  const contractOwner = await contract.owner();
  console.log(`Owner: ${contractOwner}`);

  const count = await contract.getProofCount();
  console.log(`Proof count: ${count.toString()}`);

  const deploymentInfo = {
    contractAddress: address,
    network: "Polygon Amoy",
    chainId: 80002,
    deployer: wallet.address,
    explorer: `${EXPLORER}/address/${address}`,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(__dirname, "..", "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment.json");

  const envPath = path.join(__dirname, "..", ".env");
  let envContent = fs.readFileSync(envPath, "utf8");
  envContent = envContent.replace(
    /VITE_HHGOA_CONTRACT_ADDRESS=.*/,
    `VITE_HHGOA_CONTRACT_ADDRESS=${address}`
  );
  fs.writeFileSync(envPath, envContent);
  console.log("Updated .env with contract address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
