import React, { useContext, useEffect, useState } from 'react';
import { BigNumber } from '@ethersproject/bignumber';
import { EthereumContext } from './App';
import { Contracts, EthereumData } from './utils/types';
import { ethers } from 'ethers';

const Header = () => {
  const { address, block, data: contracts }  = useContext<EthereumData<Contracts>>(EthereumContext);
  const [ usdcBalance, setUsdcBalance ] = useState<BigNumber>(BigNumber.from(0));
  const [ usdcDecimals, setUsdcDecimals ] = useState<number>(6);
  const [ casinoTokenBalance, setCasinoTokenBalance ] = useState<BigNumber>(BigNumber.from(0));

  useEffect(() => {
    const getBalances = async () => {
      if (address && contracts) {
        setUsdcBalance(await contracts.usdc.balanceOf(address));
        setUsdcDecimals(await contracts.usdc.decimals());
        setCasinoTokenBalance(await contracts.casinoToken.balanceOf(address));
      }
    };

    getBalances();
  }, [ block, contracts, address ]);

  return (
    <nav className='navbar navbar-expand-md navbar-dark bg-dark'>
      <div className='container'>
        <div className='navbar-header'>
          <a className='navbar-brand' href='#'>Token Casino</a>
        </div>
        <div className='nav text-light d-flex flex-row justify-content-between'>
          <div className='col-6-md mx-2'>Wallet address: { address }</div>
          <div className='col-6-md mx-2 row'><span className='col-12 px-0'>USDC Balance: { ethers.utils.formatUnits(usdcBalance, usdcDecimals) } USDC</span><span className='col-12 px-0'>Casino Tokens: { casinoTokenBalance.toString() }</span></div>
        </div>
      </div>
    </nav>
  );
}

export default Header;