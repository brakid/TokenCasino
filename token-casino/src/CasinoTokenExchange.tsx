import React, { useContext, useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import { EthereumContext } from './App';
import { LARGE_ALLOWANCE, showErrors } from './utils/helpers';
import { Contracts, EthereumData } from './utils/types';

const parseExchangeRate = (value: [BigNumber, BigNumber]): BigNumber => {
  const [nominator, denominator] = value;
  return nominator.div(denominator);
}

const usdcToCasinoToken = (usdcAmount: BigNumber, usdcDecimals: number, exchangeRate: BigNumber): BigNumber => {
  return usdcAmount.div(Math.pow(10, usdcDecimals)).mul(exchangeRate);
}

const increaseAllowance = (tokenContract: ethers.Contract, initiatorAddress: string, amount: BigNumber): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const transaction = await tokenContract.approve(initiatorAddress, amount);
      await transaction.wait();
      resolve();
    } catch (err) {
      console.log(JSON.stringify(err));
      reject(JSON.stringify(err));
    }
  });
};

const ExchangeUsdcForCasinoToken = () => {
  const { address, block, data: contracts } = useContext<EthereumData<Contracts>>(EthereumContext);
  const [exchangeRate, setExchangeRate] = useState<BigNumber>(BigNumber.from(1));
  const [usdcBalance, setUsdcBalance] = useState<BigNumber>(BigNumber.from(0));
  const [maximumCasinoTokenCount, setMaximumCasinoTokenCount] = useState<BigNumber>(BigNumber.from(0));
  const [count, setCount] = useState<number>(0);
  const [waiting, setWaiting] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const getBalances = async () => {
      if (address && contracts) {
        const usdcBalance = await contracts.usdc.balanceOf(address);
        const usdcDecimals = await contracts.usdc.decimals();
        const exchangeRate = parseExchangeRate(await contracts.casinoToken.getConversionFactor());
        setUsdcBalance(usdcBalance);
        setExchangeRate(exchangeRate);
        setMaximumCasinoTokenCount(usdcToCasinoToken(usdcBalance, usdcDecimals, exchangeRate));
      }
    };

    getBalances();
  }, [block, contracts, address]);

  const updateCount = (valueString: string): void => {
    const value: number = parseInt(valueString);
    if (!isNaN(value)) {
      setCount(value);
      setErrors([]);
    } else {
      setErrors(errors => [...errors, 'Not a valid number']);
      setCount(0);
    }
  }

  const mintCasinoToken = async () => {
    const mintCasinoTokenCount = BigNumber.from(count);

    if (mintCasinoTokenCount.lte(BigNumber.from(0))) {
      setErrors(errors => [...errors, 'CasinoToken count must be larger than 0']);
    }
    if (mintCasinoTokenCount.gt(maximumCasinoTokenCount)) {
      setErrors(errors => [...errors, 'Buy request will exceed available USDC funds']);
    }

    if (contracts && mintCasinoTokenCount.gt(BigNumber.from(0)) && mintCasinoTokenCount.lte(maximumCasinoTokenCount) && !waiting) {
      setWaiting(true);
      try {
        const usdcAllowance: BigNumber = await contracts.usdc.allowance(address, contracts.casinoToken.address);
        if (usdcAllowance.lt(usdcBalance)) {
          await increaseAllowance(contracts.usdc, contracts.casinoToken.address, LARGE_ALLOWANCE);
        }

        const transaction = await contracts.casinoToken.mint(mintCasinoTokenCount);
        await transaction.wait();
        setCount(0);
        setErrors([]);
      } catch (err) {
        console.log(JSON.stringify(err));
        setErrors(errors => [...errors, JSON.stringify(err)]);
      }
      setWaiting(false);
    }
  };

  return (
    <article className='col-md-4'>
      <div className='card'>
        <div className='card-body'>
          {showErrors(errors)}
          <div className='form-group'>
            <label htmlFor='usdcToCas'>Exchange 1 USDC for {exchangeRate.toString()} CasinoToken.<br />You can get at most {maximumCasinoTokenCount.toString()} CasinoToken.</label><br />
            <input className='form-control' id='usdcToCas' type='text' value={(count || 0).toString()} onChange={(e) => updateCount(e.target.value)} placeholder='CasinoToken to exchange' />
          </div>
          <button className='btn btn-primary col' onClick={(e) => mintCasinoToken()} disabled={waiting}><i className='fas fa-arrow-right'></i> Buy Casino Tokens</button>
        </div>
      </div>
    </article>
  );
}

const ExchangeCasinoTokenForUsdc = () => {
  const { address, block, data: contracts } = useContext<EthereumData<Contracts>>(EthereumContext);
  const [exchangeRate, setExchangeRate] = useState<BigNumber>(BigNumber.from(1));
  const [casinoTokenCount, setCasinoTokenCount] = useState<BigNumber>(BigNumber.from(0));
  const [count, setCount] = useState<number>(0);
  const [waiting, setWaiting] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const getBalances = async () => {
      if (address && contracts) {
        const casinoTokenCount = await contracts.casinoToken.balanceOf(address);
        const exchangeRate = parseExchangeRate(await contracts.casinoToken.getConversionFactor());
        setCasinoTokenCount(casinoTokenCount);
        setExchangeRate(exchangeRate);
      }
    };

    getBalances();
  }, [block, contracts, address]);

  const updateCount = (valueString: string): void => {
    const value: number = parseInt(valueString);
    if (!isNaN(value)) {
      setCount(value);
      setErrors([]);
    } else {
      setErrors(errors => [...errors, 'Not a valid number']);
      setCount(0);
    }
  }

  const burnCasinoToken = async () => {
    const burnCasinoTokenCount = BigNumber.from(count);

    if (burnCasinoTokenCount.lte(BigNumber.from(0))) {
      setErrors(errors => [...errors, 'CasinoToken count must be larger than 0']);
    }
    if (burnCasinoTokenCount.gt(casinoTokenCount)) {
      setErrors(errors => [...errors, 'Sell request will exceed available CasinoToken count']);
    }

    if (contracts && burnCasinoTokenCount.gt(BigNumber.from(0)) && burnCasinoTokenCount.lte(casinoTokenCount) && !waiting) {
      setWaiting(true);
      try {
        const transaction = await contracts.casinoToken.burn(burnCasinoTokenCount);
        await transaction.wait();
        setCount(0);
        setErrors([]);
      } catch (err) {
        console.log(JSON.stringify(err));
        setErrors(errors => [...errors, JSON.stringify(err)]);
      }
      setWaiting(false);
    }
  };

  return (
    <article className='col-md-4 ml-md-5 mt-sm-0 mt-5'>
      <div className='card'>
        <div className='card-body'>
          {showErrors(errors)}
          <div className='form-group'>
            <label htmlFor='casToUsdc'>Exchange {exchangeRate.toString()} CasinoToken for 1 USDC.<br />You can change at most {casinoTokenCount.toString()} CasinoToken.</label><br />
            <input className='form-control' id='casToUsdc' type='text' value={(count || 0).toString()} onChange={(e) => updateCount(e.target.value)} placeholder='CasinoToken to exchange' />
          </div>
          <button className='btn btn-primary col' onClick={(e) => burnCasinoToken()} disabled={waiting}><i className='fas fa-arrow-left'></i> Sell CasinoToken</button>
        </div>
      </div>
    </article>
  );
}

const CasinoTokenExchange = () => {
  return (
    <section className='container my-5'>
      <div className='row justify-content-md-center'>
        <ExchangeUsdcForCasinoToken />
        <ExchangeCasinoTokenForUsdc />
      </div>
    </section>
  );
}

export default CasinoTokenExchange;