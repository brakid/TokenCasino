// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./CasinoToken.sol";
import "./IRandomNumberOracle.sol";

contract Casino {
  event PlayEvent (
    address player,
    uint bet,
    uint payout,
    bool hasPlayerWon,
    uint32 casinoCard,
    uint32 playerCard,
    uint date
  );

  address public admin;
  CasinoToken public casinoToken;
  IRandomNumberOracle public randomNumberOracle;
  uint public payoutFactor;
  uint public safetyAmount;
  uint public maxBetAmount;
  
  constructor(address casinoTokenAddress, address randomNumberOracleAddress, uint payout, uint safety, uint maxBet) {
    admin = msg.sender;
    casinoToken = CasinoToken(casinoTokenAddress);
    randomNumberOracle = IRandomNumberOracle(randomNumberOracleAddress);
    payoutFactor = payout;
    safetyAmount = safety;
    maxBetAmount = maxBet;
  }

  function play(uint bet) public {
    require(getCasinoBalance() >= bet && bet <= maxBetAmount, 'Bet is too large');

    (uint32 casinoValue, uint32 playerValue) = randomNumberOracle.getRandomNumberPair();

    uint32 casinoCard = casinoValue % 13; // values 0..12 -> 0 = 2, 12 = Ace
    uint32 playerCard = playerValue % 13;

    bool hasPlayerWon = casinoCard < playerCard;
    uint payout = hasPlayerWon ? SafeMath.mul(bet, payoutFactor) : 0;

    emit PlayEvent(msg.sender, bet, payout, hasPlayerWon, casinoCard, playerCard, block.timestamp);

    if (payout > 0) {
      casinoToken.transfer(msg.sender, SafeMath.sub(payout, bet));
    } else {
      casinoToken.transferFrom(msg.sender, address(this), bet);
    }
  }

  function getCasinoBalance() public view returns (uint) {
    return SafeMath.sub(casinoToken.balanceOf(address(this)), safetyAmount);
  }
}