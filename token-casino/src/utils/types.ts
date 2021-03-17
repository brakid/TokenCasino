import { BigNumber, ethers } from "ethers";

export interface Blockchain {
  provider: ethers.providers.Web3Provider,
  paymentProcessor: ethers.Contract,
  usdc: ethers.Contract,
}

export interface Product {
  price: BigNumber,
  productId: BigNumber,
};

export interface Payment {
  paymentId: string,
  productId: string,
};

export interface Wallet {
  readonly address: string,
  readonly ethereumBalance: BigNumber,
  readonly usdcBalance: BigNumber,
  readonly allowance: BigNumber,
};