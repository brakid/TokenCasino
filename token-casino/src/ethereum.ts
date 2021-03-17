import { paymentProcessorAbi, paymentProcessorAddress, usdcAddress } from './utils/contracts';
import { ethers } from 'ethers';
import { Blockchain } from './utils/types';

// https://ethereumdev.io/abi-for-erc20-contract-on-ethereum/
const erc20Abi = require('./utils/erc20Abi.json');

export const getBlockchain = async (): Promise<Blockchain> => {
  return new Promise((resolve) => {
    window.addEventListener('load', async () => {
      const windowElement: { [key: string]: any } = window;
      if (('ethereum' in window)) {
        await windowElement['ethereum'].enable();
        const provider = new ethers.providers.Web3Provider(windowElement['ethereum']);
        const signer = provider.getSigner();

        const paymentProcessor =
          new ethers.Contract(
            paymentProcessorAddress,
            paymentProcessorAbi,  
            signer);

        const usdc =
            new ethers.Contract(
              usdcAddress,
              erc20Abi,
              signer);

        resolve({ provider, paymentProcessor, usdc });
      }
    });
  });
};