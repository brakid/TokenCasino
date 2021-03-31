// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRandomNumberOracle {
  function getRandomNumberPair() external returns (uint32, uint32);
}