// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CasinoToken is ERC20 {
  address public admin;

  constructor() ERC20('Casino Token', 'CAS') {
    admin = msg.sender;
    _setupDecimals(0); //token is no divisible
  }

  function isAdmin() public view returns (bool) {
    return admin == msg.sender;
  }

  function setAdmin(address newAdmin) public {
    require(msg.sender == admin, 'Only the admin is allowed to call this operation');
    require(newAdmin != address(0), 'New admin must not be the 0x0 address');
    admin = newAdmin;
  }

  function mint(address to, uint amount) public {
    require(msg.sender == admin, 'Only the admin is allowed to call this operation');
    _mint(to, amount);
  }

  function burn(address from, uint amount) public {
    require(msg.sender == admin, 'Only the admin is allowed to call this operation');
    _burn(from, amount);
  }
}