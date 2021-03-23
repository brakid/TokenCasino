import React, { useEffect, useState } from 'react';
import Casino from './Casino';
import CasinoTokenExchange from './CasinoTokenExchange';
import Header from './Header';
import { getContracts } from './utils/contracts';
import { getWeb3Provider, getWebsocketProvider } from './utils/ethereum';
import { EthereumData, Contracts, Providers, Block } from './utils/types';

export const defaultBlock: Block = {
  blockNumber: -1,
  timestamp: new Date(),
};

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
      }, 2000);

      setProviders({ web3Provider, websocketProvider });
      setAddress(await web3Provider.getSigner().getAddress());
      setContracts(getContracts(web3Provider));
    };

    init();
  }, []);

  return (
    <EthereumContext.Provider value={ { ...providers, address, data: contracts, block } }>
      <Header />
      <main role='main'>
        <CasinoTokenExchange />
        <Casino />
      </main>
      <footer className='navbar navbar-expand-lg navbar-dark bg-dark text-light mt-5'>
        <div className='container justify-content-md-center'>
          <div className='col-sm-3 text-sm-left text-center'>Blocknumber: { block.blockNumber }</div>
          <div className='col-sm-3 text-center'><a href='http://www.freepik.com'>Cards designed by brgfx / Freepik</a></div>
          <div className='col-sm-3 text-sm-right text-center'>&copy; Hagen Schupp 2021</div>
        </div>
      </footer>
    </EthereumContext.Provider>
  );
}

export default App;