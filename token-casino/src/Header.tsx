import { BigNumber } from '@ethersproject/bignumber';
import { ethers } from 'ethers';
import React, { useContext, useEffect, useState } from 'react';
import { EthereumContext } from './App';
import { Contracts, EthereumData } from './utils/types';

const formatBalance = (balance: BigNumber, decimals: number, symbol: string = ''): string => {
  return balance.div(Math.pow(10, decimals)).toString() + ' ' + symbol;
}

const Header = () => {
  const { metamaskProvider, blockNumber, data: contracts }  = useContext<EthereumData<Contracts>>(EthereumContext);
  const [ address, setAddress ] = useState<string>();
  const [ usdcBalance, setUsdcBalance ] = useState<string>('');
  const [ casinoTokenBalance, setCasinoTokenBalance ] = useState<string>('');

  useEffect(() => {
    const getAddress = async () => {
      setAddress(await metamaskProvider?.getSigner().getAddress());
    };

    getAddress();
  }, [ metamaskProvider ]);

  useEffect(() => {
    const getBalances = async () => {
      if (address && contracts) {
        console.log(await contracts.usdc.decimals());
        setUsdcBalance(formatBalance(await contracts.usdc.balanceOf(address), await contracts.usdc.decimals(), await contracts.usdc.symbol()));
        setCasinoTokenBalance(formatBalance(await contracts.casinoToken.balanceOf(address), await contracts.casinoToken.decimals()));
      }
    };

    getBalances();
  }, [ blockNumber, contracts, address ]);

  return (
    <nav>
      <h1>Token Casino</h1><span>Wallet address: { address }, USDC Balance: { usdcBalance }, Casino Tokens: { casinoTokenBalance } </span>
    </nav>
  );
}

export default Header;
