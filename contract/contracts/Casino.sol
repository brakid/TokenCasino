// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./CasinoToken.sol";
import "./IRandomNumberOracle.sol";
import "./Owned.sol";

contract Casino is Owned {
  event PlayEvent (
    address indexed player,
    uint bet,
    uint payout,
    bool hasPlayerWon,
    uint32 casinoCard,
    uint32 playerCard,
    uint date
  );

  CasinoToken public immutable casinoToken;
  IRandomNumberOracle public immutable randomNumberOracle;
  uint public immutable payoutFactor;
  uint public immutable safetyAmount;
  uint public immutable maxBetAmount;
  
  constructor(address casinoTokenAddress, address randomNumberOracleAddress, uint payout, uint safety, uint maxBet) {
    casinoToken = CasinoToken(casinoTokenAddress);
    randomNumberOracle = IRandomNumberOracle(randomNumberOracleAddress);
    payoutFactor = payout;
    safetyAmount = safety;
    maxBetAmount = maxBet;
  }

  function play(uint bet) external {
    require(getCasinoBalance() >= bet && bet <= maxBetAmount, 'Bet is too large');
    require(casinoToken.balanceOf(msg.sender) >= bet, 'Bet exceeds players balance');
    require(casinoToken.allowance(msg.sender, address(this)) >= bet, 'Bet exceeds players allowance');

    (uint32 casinoValue, uint32 playerValue) = randomNumberOracle.getRandomNumberPair();

    uint32 casinoCard = casinoValue % 13; // values 0..12 -> 0 = 2, 12 = Ace
    uint32 playerCard = playerValue % 13;

    bool hasPlayerWon = casinoCard < playerCard;
    uint payout = hasPlayerWon ? SafeMath.mul(bet, payoutFactor) : 0;

    if (payout > 0) {
      casinoToken.transfer(msg.sender, SafeMath.sub(payout, bet));
    } else {
      casinoToken.transferFrom(msg.sender, address(this), bet);
    }

    emit PlayEvent(msg.sender, bet, payout, hasPlayerWon, casinoCard, playerCard, block.timestamp);
  }

  function getCasinoBalance() public view returns (uint) {
    return SafeMath.sub(casinoToken.balanceOf(address(this)), safetyAmount);
  }

  function transferBalance() external onlyAdmin {
    uint balance = casinoToken.balanceOf(address(this));
    require(balance > 0, 'Casino has no funds for CasinoToken');
    casinoToken.transfer(admin, balance);
  }
}