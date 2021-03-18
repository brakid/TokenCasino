import React, { useContext, useEffect, useState } from 'react';
import { BigNumber } from '@ethersproject/bignumber';
import { EthereumContext } from './App';
import { Contracts, EthereumData } from './utils/types';
import { getBalance } from './utils/helpers';

const Header = () => {
  const { address, block, data: contracts }  = useContext<EthereumData<Contracts>>(EthereumContext);
  const [ usdcBalance, setUsdcBalance ] = useState<BigNumber>(BigNumber.from(0));
  const [ casinoTokenBalance, setCasinoTokenBalance ] = useState<BigNumber>(BigNumber.from(0));

  useEffect(() => {
    const getBalances = async () => {
      if (address && contracts) {
        setUsdcBalance(await getBalance(contracts.usdc, address));
        setCasinoTokenBalance(await getBalance(contracts.casinoToken, address, 0));
      }
    };

    getBalances();
  }, [ block, contracts, address ]);

  return (
    <nav>
      <h1>Token Casino</h1><span>Wallet address: { address }, USDC Balance: { usdcBalance.toString() } USDC, Casino Tokens: { casinoTokenBalance.toString() } </span>
    </nav>
  );
}

export default Header;
