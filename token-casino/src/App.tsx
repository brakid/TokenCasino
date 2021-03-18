import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import Bank from './Bank';
import Header from './Header';
import { getContracts } from './utils/contracts';
import { getWeb3Provider, getWebsocketProvider } from './utils/ethereum';
import { EthereumData, Contracts, Providers, Block } from './utils/types';

export const defaultBlock: Block = {
  blockNumber: -1,
  timestamp: new Date(),
};

const getBlock = async (websocketProvider: ethers.providers.WebSocketProvider): Promise<Block> => {
  return new Promise(async (resolve) => {
    resolve({
      blockNumber: await websocketProvider.getBlockNumber(),
      timestamp: new Date(),
    })
  })
}

export const EthereumContext = React.createContext<EthereumData<Contracts>>({ block: defaultBlock });

const App = () => {
  const [ providers, setProviders ] = useState<Providers>();
  const [ address, setAddress ] = useState<string>();
  const [ block, setBlock ] = useState<Block>(defaultBlock);
  const [ contracts, setContracts ] = useState<Contracts>();

  useEffect(() => {
    const init = async () => {
      const web3Provider = await getWeb3Provider();
      const websocketProvider = await getWebsocketProvider();

      setBlock({
        blockNumber: await websocketProvider.getBlockNumber(),
        timestamp: new Date(),
      });
      websocketProvider.on('block', (latestBlockNumber) => {
        setBlock({
          blockNumber: latestBlockNumber,
          timestamp: new Date()
        });
      });

      setInterval(async () => {
        setBlock({
          blockNumber: await websocketProvider.getBlockNumber(),
          timestamp: new Date(),
        });
      }, 5000);

      setProviders({ web3Provider, websocketProvider });
      setAddress(await web3Provider.getSigner().getAddress());
      setContracts(getContracts(web3Provider));
    };

    init();
  }, []);

  return (
    <EthereumContext.Provider value={ { ...providers, address, data: contracts, block } }>
      <Header />
      <Bank />
      <footer>
        <span>Blocknumber: { block.blockNumber } - { block.timestamp.toLocaleTimeString() }</span>
      </footer>
    </EthereumContext.Provider>
  );
}

export default App;