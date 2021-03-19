import React, { useContext, useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import { EthereumContext } from './App';
import { getBalance, LARGE_ALLOWANCE } from './utils/helpers';
import { Contracts, EthereumData } from './utils/types';

const parseExchangeRate = (value: [BigNumber, BigNumber]): BigNumber => {
  const [nominator, denominator] = value;
  return nominator.div(denominator);
}

const usdcToCasinoToken = (usdcAmount: BigNumber, usdcDecimals: number, exchangeRate: BigNumber): BigNumber => {
  return usdcAmount.div(Math.pow(10, usdcDecimals)).mul(exchangeRate);
}

const ExchangeForm = ({ exchange, maximumAmount }: { exchange: (tokenAmount: BigNumber) => Promise<void>, maximumAmount: BigNumber }) => {
  const [ amount, setAmount ] = useState<string>('0');

  console.log('Amount: ' + maximumAmount.toString());

  const onClick = async () => {
    const amountValue = BigNumber.from(amount);
    if (amountValue.gt(BigNumber.from(0))) {
      await exchange(amountValue);
    }
  }

  return (
    <div>
      <input type='text' value= { amount } onChange={ (e) => setAmount(e.target.value) } placeholder='CasinoTokens to exchange' />
      <button onClick={ (e) => onClick() }>Buy Casino Tokens</button>
    </div>
  );
}

const Bank = () => {
  const { address, block, data: contracts }  = useContext<EthereumData<Contracts>>(EthereumContext);
  const [ exchangeRate, setExchangeRate ] = useState<BigNumber>(BigNumber.from(1));
  const [ usdcBalance, setUsdcBalance ] = useState<BigNumber>(BigNumber.from(0));
  const [ usdcDecimals, setUsdcDecimals ] = useState<number>(6);
  const [ casinoTokenBalance, setCasinoTokenBalance ] = useState<BigNumber>(BigNumber.from(0));

  useEffect(() => {
    const getBalances = async () => {
      if (address && contracts) {
        setUsdcBalance(await getBalance(contracts.usdc, address, await contracts.casinoToken.decimals()));
        setUsdcDecimals(await contracts.usdc.decimals());
        setCasinoTokenBalance(await getBalance(contracts.casinoToken, address, 0));
        setExchangeRate(parseExchangeRate(await contracts.casinoToken.getConversionFactor()));
      }
    };

    getBalances();
  }, [ block, contracts, address ]);

  const increaseAllowance = async (tokenContract: ethers.Contract, bankAddress: string, amount: BigNumber) => {
    try {
      const transaction = await tokenContract.approve(bankAddress, amount);
      await transaction.wait();
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  };

  const buyIn = async (casinoTokenCount: BigNumber) => {
    if (!!!contracts || casinoTokenCount.lte(BigNumber.from(0))) {
      return;
    }

    const usdcAmount = casinoTokenCount.mul(Math.pow(10, usdcDecimals)).div(exchangeRate);
    
    const usdcAllowance: BigNumber = await contracts.usdc.allowance(address, contracts.casinoToken.address);
    if (usdcAllowance.lt(usdcAmount)) {
      await increaseAllowance(contracts.usdc, contracts.casinoToken.address, LARGE_ALLOWANCE);
    }

    try {
      const transaction = contracts.casinoToken.mint(casinoTokenCount);
      await transaction.wait();
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  const cashOut = async (casinoTokenCount: BigNumber) => {
    if (!!!contracts || casinoTokenCount.lte(BigNumber.from(0))) {
      return;
    }

    try {
      const transaction = contracts.casinoToken.burn(casinoTokenCount);
      await transaction.wait();
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  }

  return (
    <section>
      <h2>Casino Token Bank</h2>
      <p>Exchange USDC with CasinoTokens, the exchange rate is: { exchangeRate.toString() } CasinoTokens per USDC</p>
      <ExchangeForm exchange={ buyIn } maximumAmount={ usdcToCasinoToken(usdcBalance, usdcDecimals, exchangeRate) } />
      <button onClick={ (e) => cashOut(casinoTokenBalance) }>Exchange Casino Tokens for USDC</button>
    </section>
  );
}

export default Bank;