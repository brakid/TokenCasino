// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";

interface IRandomNumberOracle {
  function getRandomNumberPair() external returns (uint32, uint32);
}