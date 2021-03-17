// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./IRandomNumberOracle.sol";
import "./Owned.sol";

contract RandomNumberOracle is IRandomNumberOracle, Owned {
  event SeedUpdated (
    uint date
  );

  uint32 private _seed;

  constructor(uint32 initialSeed) {
    _seed = initialSeed; 
  }

  function setSeed(uint32 newSeed) external onlyAdmin {
    emit SeedUpdated(block.timestamp);
    _seed = newSeed;
  }

  function getRandomNumberPair() external override returns (uint32, uint32) {
    return (getRandomNumber(), getRandomNumber());
  }

  function getRandomNumber() public returns (uint32) {
    // https://en.wikipedia.org/wiki/Lehmer_random_number_generator#Sample_C99_code
    uint32 value = uint32(SafeMath.mod(SafeMath.mul(uint64(_seed), 48271), 0x7fffffff) & 0xffffffff);
    _seed = value;
    return value;
  }
}