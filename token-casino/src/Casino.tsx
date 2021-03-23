import React, { useContext, useEffect, useState } from 'react';
import { BigNumber, ethers, EventFilter } from 'ethers';
import { EthereumContext } from './App';
import { LARGE_ALLOWANCE, showErrors } from './utils/helpers';
import { Contracts, EthereumData } from './utils/types';
import ace from './cards/ace.png';
import king from './cards/king.png';
import queen from './cards/queen.png';
import joker from './cards/joker.png';
import ten from './cards/10.png';
import nine from './cards/9.png';
import eight from './cards/8.png';
import seven from './cards/7.png';
import six from './cards/6.png';
import five from './cards/5.png';
import four from './cards/4.png';
import three from './cards/3.png';
import two from './cards/2.png';

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

enum CardValue {
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
  Joker,
  Queen,
  King, 
  Ace,
};

const numberToCardValue = (value: number): CardValue => {
  switch (value) {
    case 0: return CardValue.Two;
    case 1: return CardValue.Three;
    case 2: return CardValue.Four;
    case 3: return CardValue.Five;
    case 4: return CardValue.Six;
    case 5: return CardValue.Seven;
    case 6: return CardValue.Eight;
    case 7: return CardValue.Nine;
    case 8: return CardValue.Ten;
    case 9: return CardValue.Joker;
    case 10: return CardValue.Queen;
    case 11: return CardValue.King;
    case 12: return CardValue.Ace;
    default: throw new Error('Invalid card number');
  }
};

const CardElement = ({ card }: { card: CardValue }) => {
  return (
    <>
      <img className='rounded mx-auto' src={ ace } style={{ display: (card === CardValue.Ace) ? 'block' : 'none' }} alt='Ace'/>
      <img className='rounded mx-auto' src={ king } style={{ display: (card === CardValue.King) ? 'block' : 'none' }} alt='King'/>
      <img className='rounded mx-auto' src={ queen } style={{ display: (card === CardValue.Queen) ? 'block' : 'none' }} alt='Queen'/>
      <img className='rounded mx-auto' src={ joker } style={{ display: (card === CardValue.Joker) ? 'block' : 'none' }} alt='Joker'/>
      <img className='rounded mx-auto' src={ ten } style={{ display: (card === CardValue.Ten) ? 'block' : 'none' }} alt='Ten'/>
      <img className='rounded mx-auto' src={ nine } style={{ display: (card === CardValue.Nine) ? 'block' : 'none' }} alt='Nine'/>
      <img className='rounded mx-auto' src={ eight } style={{ display: (card === CardValue.Eight) ? 'block' : 'none' }} alt='Eight'/>
      <img className='rounded mx-auto' src={ seven } style={{ display: (card === CardValue.Seven) ? 'block' : 'none' }} alt='Seveb'/>
      <img className='rounded mx-auto' src={ six } style={{ display: (card === CardValue.Six) ? 'block' : 'none' }} alt='Six'/>
      <img className='rounded mx-auto' src={ five } style={{ display: (card === CardValue.Five) ? 'block' : 'none' }} alt='Five'/>
      <img className='rounded mx-auto' src={ four } style={{ display: (card === CardValue.Four) ? 'block' : 'none' }} alt='Four'/>
      <img className='rounded mx-auto' src={ three } style={{ display: (card === CardValue.Three) ? 'block' : 'none' }} alt='Three'/>
      <img className='rounded mx-auto' src={ two } style={{ display: (card === CardValue.Two) ? 'block' : 'none' }} alt='Two'/>
    </>
  );
}

interface PlayEvent {
  payout: BigNumber,
  hasPlayerWon: boolean,
  casinoCard: number,
  playerCard: number,
  date: Date,
};

const PlayEventElement = ({ playEvent }: { playEvent: PlayEvent }) => {
  return (
    <article>
      <div className='row my-5'>
        <div className='col-md-6'><b>Casino Card:</b><CardElement card={ numberToCardValue(playEvent.casinoCard) } /></div>
        <div className='col-md-6 mt-md-0 mt-5'><b>Your Card:</b><CardElement card={ numberToCardValue(playEvent.playerCard) } /></div>
      </div>
      { playEvent.hasPlayerWon && <div className='alert alert-success'>You won { playEvent.payout.toString() } CAS</div> }
      { !playEvent.hasPlayerWon && <div className='alert alert-warning'>You lost your bet...</div> }
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
        contracts.casino.once(filter, (player: string, bet: BigNumber, payout: BigNumber, hasPlayerWon: boolean, casinoCard: number, playerCard: number, timestamp: BigNumber) => {
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
        <div className='col-md-8'>
          <h2><i className='fas fa-dice'></i> Casino</h2>
          { showErrors(errors) }
          { !!!playEvent && (<>
            <div className='form-group'>
              <label htmlFor='bet'>Max bet amount: { maxBetAmount.toString() }, Casino Balance: { casinoBalance.toString() } CAS.</label><br />
              <input className='form-control' id='bet' type='text' value= { (count || 0).toString() } onChange={ (e) => updateCount(e.target.value) } placeholder='CasinoToken to bet' />
            </div>
            <button className='btn btn-primary col mb-5' onClick={ (e) => placeBet() } disabled={ waiting } ><i className='fas fa-dice'></i> Place Bet &amp; Play</button>
          </>) }
          { waiting && (<div className='d-flex justify-content-center'>
            <div className='spinner-grow text-primary' role='status'></div>
          </div>) }
          { playEvent && (<>
            <PlayEventElement playEvent={ playEvent } />
            <button className='btn btn-primary col' onClick={ (e) => setPlayEvent(undefined) }><i className='fas fa-redo'></i> Play again</button>
          </>) }
        </div>
      </div>
    </section>
  );
}

export default Casino;