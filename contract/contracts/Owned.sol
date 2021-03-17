// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

contract Owned {
  address public admin = msg.sender;

  modifier onlyAdmin {
    require(msg.sender == admin, 'Only the admin is allowed to call this operation');
    _;
  }
}