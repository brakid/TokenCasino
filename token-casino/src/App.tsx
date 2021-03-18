import React, { useEffect, useState } from 'react';
import Header from './Header';
import { getContracts } from './utils/contracts';
import { getMetamaskProvider, getWebsocketProvider } from './utils/ethereum';
import { EthereumData, Contracts, Providers } from './utils/types';

export const EthereumContext = React.createContext<EthereumData<Contracts>>({ blockNumber: -1});

const App = () => {
  const [ providers, setProviders ] = useState<Providers>();
  const [ blockNumber, setBlocknumber ] = useState<number>(-1);
  const [ contracts, setContracts ] = useState<Contracts>();

  useEffect(() => {
    const init = async () => {
      const metamaskProvider = await getMetamaskProvider();
      const websocketProvider = await getWebsocketProvider();

      setBlocknumber(await websocketProvider.getBlockNumber());
      websocketProvider.on('block', (latestBlockNumber) => {
        setBlocknumber(latestBlockNumber);
      });

      setProviders({ metamaskProvider, websocketProvider });
      setContracts(getContracts(metamaskProvider));
    };

    init();
  }, []);

  return (
    <div>
      <h1>Token Store</h1>
      <EthereumContext.Provider value={ { ...providers, data: contracts, blockNumber } }>
        <Header />
        <Bank />
        <Casino />
        <footer>
          <span>Blocknumber: { blockNumber }</span>
        </footer>
      </EthereumContext.Provider>
    </div>
  );
}

export default App;