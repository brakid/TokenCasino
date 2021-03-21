import React, { useContext, useEffect, useState } from 'react';
import { BigNumber, ethers, EventFilter } from 'ethers';
import { EthereumContext } from './App';
import { LARGE_ALLOWANCE, showErrors } from './utils/helpers';
import { Contracts, EthereumData } from './utils/types';

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

interface PlayEvent {
  payout: BigNumber,
  hasPlayerWon: boolean,
  casinoCard: BigNumber,
  playerCard: BigNumber,
  date: Date,
};

const PlayEventElement = ({ playEvent }: { playEvent: PlayEvent }) => {
  return (
    <article>
      <div>Casino Card: { playEvent.casinoCard.toString() }</div>
      <div>Player Card: { playEvent.playerCard.toString() }</div>
      { playEvent.hasPlayerWon && <div>You won!!! { playEvent.payout.toString() }</div> }
      { !playEvent.hasPlayerWon && <div>You lost!!!</div> }
    </article>
  );
}

const Casino = () => {
  const { address, block, data: contracts }  = useContext<EthereumData<Contracts>>(EthereumContext);
  const [ casinoTokenCount, setCasinoTokenCount ] = useState<BigNumber>(BigNumber.from(0));
  const [ maxBetAmount, setMaxBetAmount ] = useState<BigNumber>(BigNumber.from(0));
  const [ casinoBalance, setCasinoBalance ] = useState<BigNumber>(BigNumber.from(0));
  const [ count, setCount ] = useState<number>(0);
  const [ waiting, setWaiting ] = useState<boolean>(false);
  const [ playEvent, setPlayEvent ] = useState<PlayEvent>();
  const [ errors, setErrors ] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (address && contracts) {
        setCasinoTokenCount(await contracts.casinoToken.balanceOf(address));
        setMaxBetAmount(await contracts.casino.maxBetAmount());
        setCasinoBalance(await contracts.casino.getCasinoBalance());
      }
    };

    loadData();
  }, [ block, contracts, address ]);

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

  const placeBet = async () => {
    const betAmount = BigNumber.from(count);

    if (betAmount.lte(BigNumber.from(0))) {
      setErrors(errors => [...errors, 'Bet must be larger than 0']);
    }
    if (betAmount.gt(maxBetAmount)) {
      setErrors(errors => [...errors, 'Bet must be smaller than ' + maxBetAmount.toString() + ' CAS']);
    }
    if (betAmount.gt(casinoTokenCount)) {
      setErrors(errors => [...errors, 'Bet exceeds available CasinoToken count: ' + casinoTokenCount.toString() + ' CAS']);
    }
    
    if (contracts && betAmount.gt(BigNumber.from(0)) && betAmount.lte(maxBetAmount) && betAmount.lte(casinoTokenCount) && !waiting) {
      setWaiting(true);
      try {
        const casinoTokenAllowance: BigNumber = await contracts.casinoToken.allowance(address, contracts.casino.address);
        if (casinoTokenAllowance.lt(betAmount)) {
          await increaseAllowance(contracts.casinoToken, contracts.casino.address, LARGE_ALLOWANCE);
        }

        const transaction = await contracts.casino.play(betAmount);
        await transaction.wait();
        
        const filter: EventFilter = contracts.casino.filters['PlayEvent(address,uint256,uint256,bool,uint32,uint32,uint256)'](address);
        contracts.casino.once(filter, (player: string, bet: BigNumber, payout: BigNumber, hasPlayerWon: boolean, casinoCard: BigNumber, playerCard: BigNumber, timestamp: BigNumber) => {
          setPlayEvent({ payout, hasPlayerWon, casinoCard, playerCard, date: new Date(timestamp.toNumber() * 1000) });
          setWaiting(false);
        });

        setCount(0);
        setErrors([]);
      } catch (err) {
        console.log(JSON.stringify(err));
        setErrors(errors => [...errors, JSON.stringify(err)]);
      }
    }
  };

  return (
    <section className='container my-5'>
      <div className='row justify-content-md-center'>
        <div className='col-8'>
          <h2>Casino</h2>
          { showErrors(errors) }
          { !!!playEvent && (<>
            <label htmlFor='bet'>Max bet amount: { maxBetAmount.toString() }, Casino Balance: { casinoBalance.toString() } CAS.</label><br />
            <input className='form-control' id='bet' type='text' value= { (count || 0).toString() } onChange={ (e) => updateCount(e.target.value) } placeholder='CasinoToken to bet' />
            <button className='btn btn-primary' onClick={ (e) => placeBet() } disabled={ waiting } >Place Bet &amp; Play</button>
          </>) }
          { waiting && (<div className='d-flex justify-content-center'>
            <div className='spinner-grow text-primary' role='status'></div>
          </div>) }
          { playEvent && (<>
            <PlayEventElement playEvent={ playEvent } />
            <button className='btn btn-primary' onClick={ (e) => setPlayEvent(undefined) }>Play again</button>
          </>) }
        </div>
      </div>
    </section>
  );
}

export default Casino;