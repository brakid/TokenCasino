// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UsdcMock is ERC20 {
  constructor() ERC20('USDC StableCoin', 'USDC') {
    _setupDecimals(6);
  }

  function faucet(address to, uint amount) external {
    _mint(to, amount);
  }
}