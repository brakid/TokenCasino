import { ethers } from 'ethers';
import { NETWORK, USDC_ADDRESS } from './externals';
import * as bank from '../abis/Bank.json';
import * as casino from '../abis/Casino.json';
import * as casinoToken from '../abis/CasinoToken.json';
import * as erc20 from '../abis/ERC20.json';
import { Contracts } from './types';

export const getContracts = (metamaskProvider: ethers.providers.Web3Provider): Contracts => {
  const signer = metamaskProvider.getSigner();

  return {
    usdc: new ethers.Contract(
      USDC_ADDRESS,
      erc20.abi,
      signer
    ),
    casinoToken: new ethers.Contract(
      casinoToken.networks[NETWORK].address,
      casinoToken.abi,
      signer
    ),
    bank: new ethers.Contract(
      bank.networks[NETWORK].address,
      bank.abi,
      signer
    ),
    casino: new ethers.Contract(
      casino.networks[NETWORK].address,
      casino.abi,
      signer
    ),
  };
};