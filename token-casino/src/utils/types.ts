import { ethers } from 'ethers';

export interface Providers {
  web3Provider?: ethers.providers.Web3Provider,
  websocketProvider?: ethers.providers.WebSocketProvider,
};

export interface Block {
  blockNumber: number,
  timestamp: Date,
}

export interface EthereumData<T> extends Providers {
  address?: string,
  block: Block,
  data?: T,
};

export interface Contracts {
  usdc: ethers.Contract,
  casinoToken: ethers.Contract,
  casino: ethers.Contract,
};