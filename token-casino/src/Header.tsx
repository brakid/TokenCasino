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
    <nav className='navbar navbar-expand-sm navbar-dark bg-dark'>
      <div className='container'>
        <div className='navbar-header'>
          <a className='navbar-brand' href='#'><i className='fas fa-coins'></i>&nbsp;&nbsp;Token Casino</a>
        </div>
        <div className='nav text-light row'>
          <div className='col-6-md mr-md-5'>
            <div className='col-12'><i className='fas fa-wallet'></i> Wallet address:</div>
            <div className='col-12'><small>{ address }</small></div>
          </div>
          <div className='col-6-md'>
            <div className='col-12'><i className='fas fa-comment-dollar'></i> USDC Balance: { ethers.utils.formatUnits(usdcBalance, usdcDecimals) } USDC</div>
            <div className='col-12'><i className='far fa-copyright'></i> Casino Tokens: { casinoTokenBalance.toString() }</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;