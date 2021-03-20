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
    <nav>
      <h1>Token Casino</h1><span>Wallet address: { address }, USDC Balance: { ethers.utils.formatUnits(usdcBalance, usdcDecimals) } USDC, Casino Tokens: { casinoTokenBalance.toString() } </span>
    </nav>
  );
}

export default Header;
