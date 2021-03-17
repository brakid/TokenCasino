import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { getBlockchain } from './ethereum';
import Store from './Store';
import { Blockchain } from './utils/types';

export interface BlockchainContextData {
  blockchain?: Blockchain,
  blockNumber: number,
};

export const BlockchainContext = React.createContext<BlockchainContextData>({ blockNumber: 0 });

const App = () => {
  const [ blockchain, setBlockchain ] = useState<Blockchain>();
  const [ blockNumber, setBlocknumber ] = useState<number>(0);

  useEffect(() => {
    const init = async () => {
      const blockchain = await getBlockchain();

      setBlockchain(blockchain);
      
      const provider = new ethers.providers.WebSocketProvider('ws://127.0.0.1:9545/');
      setBlocknumber(await provider.getBlockNumber());
      provider.on('block', (latestBlockNumber) => {
        setBlocknumber(latestBlockNumber);
      });
    };

    init();
  }, []);

  return (
    <div>
      <h1>Token Store</h1>
      <BlockchainContext.Provider value={ { blockchain, blockNumber} }>
        <Store />
        <p>Blocknumber: { blockNumber }</p>
      </BlockchainContext.Provider>
    </div>
  );
}

export default App;
