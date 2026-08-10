import { Contract, ethers, JsonRpcProvider } from "ethers";
import { getRpcUrl } from "../config/rpc";

export const LIDO_ADDRESSES = {
  stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  wstETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
};

// Minimal ABI for stETH (Lido)
export const STETH_ABI = [
  "function submit(address _referral) payable returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function getPooledEthByShares(uint256 _sharesAmount) view returns (uint256)",
  "function getSharesByPooledEth(uint256 _pooledEthAmount) view returns (uint256)",
  "event Submitted(address indexed sender, uint256 amount, address referral)",
];

// Minimal ABI for wstETH
export const WSTETH_ABI = [
  "function wrap(uint256 _stETHAmount) returns (uint256)",
  "function unwrap(uint256 _wstETHAmount) returns (uint256)",
  "function stETHPerToken() view returns (uint256)",
  "function tokensPerStETH() view returns (uint256)",
  "function getWstETHByStETH(uint256 _stETHAmount) view returns (uint256)",
  "function getStETHByWstETH(uint256 _wstETHAmount) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

// --- READ FUNCTIONS (using configured Alchemy / fallback RPC) ---
const rpcUrl = getRpcUrl(1);
const publicProvider = new JsonRpcProvider(rpcUrl);

const stETH = new Contract(LIDO_ADDRESSES.stETH, STETH_ABI, publicProvider);
const wstETH = new Contract(LIDO_ADDRESSES.wstETH, WSTETH_ABI, publicProvider);

export async function getStETHBalance(address: string): Promise<string> {
  const balance = await stETH.balanceOf(address);
  return ethers.formatEther(balance);
}

export async function getWstETHBalance(address: string): Promise<string> {
  const balance = await wstETH.balanceOf(address);
  return ethers.formatEther(balance);
}

export async function getStETHPerWstETH(): Promise<string> {
  const rate = await wstETH.stETHPerToken();
  return ethers.formatEther(rate);
}

export async function getWstETHByStETH(amount: string): Promise<string> {
  const result = await wstETH.getWstETHByStETH(ethers.parseEther(amount));
  return ethers.formatEther(result);
}

export async function getStETHByWstETH(amount: string): Promise<string> {
  const result = await wstETH.getStETHByWstETH(ethers.parseEther(amount));
  return ethers.formatEther(result);
}

// --- WRITE FUNCTIONS (require signer) ---
export async function stakeETH(
  signer: any,
  amount: string,
  referral: string = "0x0000000000000000000000000000000000000000"
): Promise<string> {
  const contract = new Contract(LIDO_ADDRESSES.stETH, STETH_ABI, signer);
  const tx = await contract.submit(referral, {
    value: ethers.parseEther(amount),
  });
  await tx.wait();
  return tx.hash;
}

export async function wrapStETH(
  signer: any,
  amount: string
): Promise<string> {
  const contract = new Contract(LIDO_ADDRESSES.wstETH, WSTETH_ABI, signer);
  const tx = await contract.wrap(ethers.parseEther(amount));
  await tx.wait();
  return tx.hash;
}

export async function unwrapWstETH(
  signer: any,
  amount: string
): Promise<string> {
  const contract = new Contract(LIDO_ADDRESSES.wstETH, WSTETH_ABI, signer);
  const tx = await contract.unwrap(ethers.parseEther(amount));
  await tx.wait();
  return tx.hash;
}
