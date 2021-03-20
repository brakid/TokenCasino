// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Owned.sol";

contract CasinoToken is ERC20 {
  IERC20 public immutable usdc;
  uint private immutable conversionNominator;
  uint private immutable conversionDenominator;
  uint private constant usdcConversion = 10**6;

  event Mint (
    address indexed targetAddress,
    uint usdcAmount,
    uint casinoTokenCount,
    uint date
  );

  event Burn (
    address indexed targetAddress,
    uint usdcAmount,
    uint casinoTokenCount,
    uint date
  );

  constructor(address usdcAddress, uint initialConversionNominator, uint initialConversionDenominator) ERC20('Casino Token', 'CAS') {
    _setupDecimals(0); //token is no divisible
    usdc = IERC20(usdcAddress);
    conversionNominator = initialConversionNominator;
    conversionDenominator = initialConversionDenominator;
  }

  function getConversionFactor() external view returns (uint, uint) {
    return (conversionNominator, conversionDenominator);
  }

  function mint(uint casinoTokenCount) external {
    require(casinoTokenCount > 0, 'Positive token requests only');
    uint usdcAmount = convertToUsdc(casinoTokenCount);
    require(usdcAmount <= SafeMath.mul(1000, usdcConversion), 'At most 1000 USDC can be exchanged');
    usdc.transferFrom(msg.sender, address(this), usdcAmount); // lock USDC in this contract
    _mint(msg.sender, casinoTokenCount);
    emit Mint(msg.sender, usdcAmount, casinoTokenCount, block.timestamp);
  }

  function burn(uint casinoTokenCount) external {
    require(casinoTokenCount > 0, 'Positive token withdrawals only');
    _burn(msg.sender, casinoTokenCount);
    uint usdcAmount = convertToUsdc(casinoTokenCount);
    usdc.transfer(msg.sender, usdcAmount);
    emit Burn(msg.sender, usdcAmount, casinoTokenCount, block.timestamp);
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