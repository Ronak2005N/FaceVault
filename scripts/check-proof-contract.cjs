const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const RPC_URL = process.env.POLYGON_AMOY_RPC || "https://polygon-amoy-bor-rpc.publicnode.com";

const deploymentPath = path.join(__dirname, "..", "deployment.json");

const ABI = [
  "function owner() view returns (address)",
  "function getProofCount() view returns (uint256)",
  "function proofExists(bytes32) view returns (bool)",
];

async function main() {
  if (!fs.existsSync(deploymentPath)) {
    console.error("No deployment.json found. Deploy the contract first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const CONTRACT_ADDRESS = deployment.contractAddress;

  console.log(`Checking contract at: ${CONTRACT_ADDRESS}`);
  console.log(`Network: ${deployment.network}`);
  console.log(`Deployed: ${deployment.timestamp}\n`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  const owner = await contract.owner();
  console.log(`Owner: ${owner}`);

  const count = await contract.getProofCount();
  console.log(`Proof count: ${count.toString()}`);

  console.log("\nContract is live and responding.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
