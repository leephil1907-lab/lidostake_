import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS as string || "0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091";
const OWNER_ADDRESS = "0xEfc5859335A58d64A5e8E01d02c5241c852CBD40";

const ABI = [
  "function name() view returns (string)",
  "function owner() view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function deposit() payable",
  "function withdraw(uint256 amount)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function spend(uint256 amount)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)"
];

async function main() {
  if (!RPC_URL || !PRIVATE_KEY) {
    throw new Error("Missing RPC_URL or PRIVATE_KEY in .env");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  const network = await provider.getNetwork();
  console.log("Chain ID:", network.chainId.toString());
  console.log("Wallet:", wallet.address);
  console.log("Designated Owner:", OWNER_ADDRESS);

  const name = await contract.name();
  const owner = await contract.owner();
  console.log("Contract name:", name);
  console.log("Owner on-chain:", owner);

  const ethBalance = await provider.getBalance(CONTRACT_ADDRESS);
  console.log("Contract ETH balance:", ethers.formatEther(ethBalance));

  try {
    const tx1 = await contract.deposit({
      value: ethers.parseEther("0.01"),
    });
    console.log("Deposit tx:", tx1.hash);
    await tx1.wait();

    const tx2 = await contract.withdraw(1);
    console.log("Withdraw tx:", tx2.hash);
    await tx2.wait();
    
    // Example: Approve owner to spend tokens
    const tx3 = await contract.approve(OWNER_ADDRESS, ethers.parseEther("1.0"));
    console.log("Approve tx:", tx3.hash);
    await tx3.wait();
  } catch (err) {
    console.log("Transaction failed (likely due to network configuration or insufficient funds):", err);
  }

  try {
    const userBalance = await contract.balanceOf(wallet.address);
    console.log("User balance:", userBalance.toString());
  } catch (err) {
    console.log("Could not fetch balance:", err);
  }
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exitCode = 1;
});
