import { ethers } from 'ethers';
import { WEBSOCKET_ADDRESS } from './externals';

export const getWeb3Provider = async (): Promise<ethers.providers.Web3Provider> => {
  return new Promise((resolve) => {
    window.addEventListener('load', async () => {
      const windowElement: { [key: string]: any } = window;
      if (('ethereum' in window)) {
        await windowElement['ethereum'].request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(windowElement['ethereum']);
        resolve(provider);
      }
    });
  });
};

export const getWebsocketProvider = async (): Promise<ethers.providers.WebSocketProvider> => {
  return new Promise((resolve) => {
    const provider = new ethers.providers.WebSocketProvider(WEBSOCKET_ADDRESS);
    resolve(provider);
  });
};