import { BigNumber, ethers } from "ethers";

export interface Providers {
  metamaskProvider?: ethers.providers.Web3Provider,
  websocketProvider?: ethers.providers.WebSocketProvider,
};

export interface EthereumData<T> extends Providers {
  blockNumber: number,
  data?: T,
};

export interface Contracts {
  usdc: ethers.Contract,
  casinoToken: ethers.Contract,
  bank: ethers.Contract,
  casino: ethers.Contract,
}

export interface Wallet {
  readonly address: string,
  readonly ethereumBalance: BigNumber,
  readonly usdcBalance: BigNumber,
  readonly allowance: BigNumber,
};