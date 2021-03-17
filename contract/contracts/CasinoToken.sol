// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Owned.sol";

contract CasinoToken is ERC20, Owned {
  constructor() ERC20('Casino Token', 'CAS') {
    _setupDecimals(0); //token is no divisible
  }

  function isAdmin() external view returns (bool) {
    return admin == msg.sender;
  }

  function setAdmin(address newAdmin) external onlyAdmin {
    require(newAdmin != address(0), 'New admin must not be the 0x0 address');
    admin = newAdmin;
  }

  function mint(address to, uint amount) external onlyAdmin {
    _mint(to, amount);
  }

  function burn(address from, uint amount) external onlyAdmin {
    _burn(from, amount);
  }
}