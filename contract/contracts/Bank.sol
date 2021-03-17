// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./CasinoToken.sol";
import "./Owned.sol";

contract Bank is Owned {
  IERC20 public usdc;
  CasinoToken public casinoToken;
  uint public conversionNominator;
  uint public conversionDenominator;
  uint public usdcConversion = 10**6;

  event BuyIn (
    address player,
    uint usdcAmount,
    uint casinoTokenCount,
    uint date
  );

  event CashOut (
    address player,
    uint usdcAmount,
    uint casinoTokenCount,
    uint date
  );

  constructor(address usdcAddress, uint initialConversionNominator, uint initialConversionDenominator) {
    usdc = IERC20(usdcAddress);
    conversionNominator = initialConversionNominator;
    conversionDenominator = initialConversionDenominator;
  }

  function setCasinoToken(address casinoTokenAddress) external onlyAdmin {
    require(casinoTokenAddress != address(0), 'Casino Token address must not be the 0x0 address');
    casinoToken = CasinoToken(casinoTokenAddress);
    require(casinoToken.isAdmin() == true, 'Requiring bank to be owner of the Casino Token');
  }

  function getConversionFactor() external view returns (uint, uint) {
    return (conversionNominator, conversionDenominator);
  }

  function buyIn(uint casinoTokenCount) external {
    require(casinoTokenCount > 0, 'Positive token requests only');
    uint usdcAmount = convertToUsdc(casinoTokenCount);
    require(usdcAmount <= SafeMath.mul(100, usdcConversion), 'At most 100 USDC can be exchanged');
    usdc.transferFrom(msg.sender, address(this), usdcAmount); // lock USDC in this contract
    emit BuyIn(msg.sender, usdcAmount, casinoTokenCount, block.timestamp);
    casinoToken.mint(msg.sender, casinoTokenCount);
  }

  function casinoBuyIn(address casinoAddress, address casinoAdmin, uint casinoTokenCount) external onlyAdmin {
    require(casinoTokenCount > 0, 'Positive token requests only');
    uint usdcAmount = convertToUsdc(casinoTokenCount);
    usdc.transferFrom(casinoAdmin, address(this), usdcAmount); // lock USDC in this contract
    emit BuyIn(casinoAddress, usdcAmount, casinoTokenCount, block.timestamp);
    casinoToken.mint(casinoAddress, casinoTokenCount);
  }

  function cashOut(uint casinoTokenCount) external {
    require(casinoTokenCount > 0, 'Positive token withdrawals only');
    casinoToken.burn(msg.sender, casinoTokenCount);
    uint usdcAmount = convertToUsdc(casinoTokenCount);
    emit CashOut(msg.sender, usdcAmount, casinoTokenCount, block.timestamp);
    usdc.transfer(msg.sender, usdcAmount);
  }

  function casinoCashOut(address casinoAddress, address casinoAdmin, uint casinoTokenCount) external onlyAdmin {
    require(casinoTokenCount > 0, 'Positive token withdrawals only');
    casinoToken.burn(casinoAddress, casinoTokenCount);
    uint usdcAmount = convertToUsdc(casinoTokenCount);
    emit CashOut(casinoAddress, usdcAmount, casinoTokenCount, block.timestamp);
    usdc.transfer(casinoAdmin, usdcAmount);
  }

  function convertToUsdc(uint casinoTokenCount) public view returns (uint) {
    // (casinoToken * 10**6) * inverse(conversionFactor)
    // conversionFactor = conversionNominator / conversionDenominator
    return 
        SafeMath.div(
            SafeMath.mul(
                SafeMath.mul(casinoTokenCount, usdcConversion), 
                conversionDenominator),
            conversionNominator);
  }
}