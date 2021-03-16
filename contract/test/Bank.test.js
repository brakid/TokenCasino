const { accounts, contract } = require('@openzeppelin/test-environment');
const [ adminAddress, otherAddress, recipientAddress, anotherAddress, _ ] = accounts;
const { BN, expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const UsdcMock = contract.fromArtifact('UsdcMock');
const CasinoToken = contract.fromArtifact('CasinoToken');
const Bank = contract.fromArtifact('Bank');

describe('Bank', async () => {
  let bank;
  let casinoToken;
  let usdcMock;
  beforeEach(async () => {
    usdcMock = await UsdcMock.new();
    bank = await Bank.new(usdcMock.address, 2, 1, { from: adminAddress }); // 2 Casino Token per USDC
    casinoToken = await CasinoToken.new({ from: adminAddress });
    await casinoToken.setAdmin(bank.address, { from: adminAddress });

    await bank.setCasinoToken(casinoToken.address, { from: adminAddress });
  });

  it('should set the casino token when called by the admin', async () => {
    let someCasinoToken = await CasinoToken.new({ from: adminAddress });
    await someCasinoToken.setAdmin(bank.address, { from: adminAddress });

    await bank.setCasinoToken(someCasinoToken.address, { from: adminAddress });
    
    expect(await bank.casinoToken.call()).to.be.equal(someCasinoToken.address);
  });

  it('should reject when the caller is not the admin', async () => {
    let someCasinoToken = await CasinoToken.new({ from: adminAddress });
    await someCasinoToken.setAdmin(bank.address, { from: adminAddress });
    
    await expectRevert(bank.setCasinoToken(someCasinoToken.address, { from: otherAddress }), 'Only the admin is allowed to call this operation');
  });

  it('should reject when the bank is not the admin of the casino token', async () => {
    let someCasinoToken = await CasinoToken.new({ from: adminAddress });
    
    await expectRevert(bank.setCasinoToken(someCasinoToken.address, { from: adminAddress }), 'Requiring bank to be owner of the Casino Token');
  });

  it('should reject when the casino token is the 0x0 address', async () => {
    await expectRevert(bank.setCasinoToken(constants.ZERO_ADDRESS, { from: adminAddress }), 'Casino Token address must not be the 0x0 address');
  });

  it('should return a the conversion factor', async () => {
    const { '0': nominator, '1': denominator } = await bank.getConversionFactor();
    
    expect(nominator).to.be.bignumber.equal(new BN(2));
    expect(denominator).to.be.bignumber.equal(new BN(1));
  });

  it('should return the correct conversion amount', async () => {
    const usdcAmount = await bank.convertToUsdc(2);
    
    expect(usdcAmount).to.be.bignumber.equal(new BN(1 * 10**6));
  });

  it('should transfer USDC and receive CasinoToken', async () => {
    await usdcMock.increaseAllowance(bank.address, 100 * 10**6, { from: recipientAddress });
    await usdcMock.faucet(recipientAddress, 100 * 10**6);

    const receipt = await bank.buyIn(200, { from: recipientAddress });

    expectEvent(receipt, 'BuyIn', {
      player: recipientAddress,
      usdcAmount: new BN(100 * 10**6),
      casinoTokenCount: new BN(200),
    });

    expect(await usdcMock.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(0));
    expect(await usdcMock.balanceOf(bank.address)).to.be.bignumber.equal(new BN(100 * 10**6));
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(200));
    expect(await casinoToken.balanceOf(bank.address)).to.be.bignumber.equal(new BN(0));
  });

  it('should revert buy in for 0 Casino Tokens', async () => {
    await expectRevert(bank.buyIn(0, { from: recipientAddress }), 'Positive token requests only');
  });

  it('should revert buy in for more than 100 USDC', async () => {
    await usdcMock.increaseAllowance(bank.address, 200 * 10**6, { from: recipientAddress });
    await usdcMock.faucet(recipientAddress, 200 * 10**6);

    await expectRevert(bank.buyIn(400, { from: recipientAddress }), 'At most 100 USDC can be exchanged');
  });

  it('should transfer USDC and receive CasinoToken for casino buy in', async () => {
    await usdcMock.increaseAllowance(bank.address, 100 * 10**6, { from: recipientAddress });
    await usdcMock.faucet(recipientAddress, 100 * 10**6);

    const receipt = await bank.casinoBuyIn(anotherAddress, recipientAddress, 200, { from: adminAddress });

    expectEvent(receipt, 'BuyIn', {
      player: anotherAddress,
      usdcAmount: new BN(100 * 10**6),
      casinoTokenCount: new BN(200),
    });

    expect(await usdcMock.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(0));
    expect(await usdcMock.balanceOf(bank.address)).to.be.bignumber.equal(new BN(100 * 10**6));
    expect(await usdcMock.balanceOf(otherAddress)).to.be.bignumber.equal(new BN(0));
    expect(await casinoToken.balanceOf(anotherAddress)).to.be.bignumber.equal(new BN(200));
    expect(await casinoToken.balanceOf(bank.address)).to.be.bignumber.equal(new BN(0));
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(0));
  });

  it('should revert casino buy in for 0 Casino Tokens', async () => {
    await expectRevert(bank.casinoBuyIn(anotherAddress, recipientAddress, 0, { from: adminAddress }), 'Positive token requests only');
  });

  it('should revert casino buy in when called not by the admin', async () => {
    await expectRevert(bank.casinoBuyIn(anotherAddress, recipientAddress, 400, { from: otherAddress }), 'Only the admin is allowed to call this operation');
  });

  it('should transfer CasinoToken and receive USDC', async () => {
    await usdcMock.increaseAllowance(bank.address, 100 * 10**6, { from: recipientAddress });
    await usdcMock.faucet(recipientAddress, 100 * 10**6);

    await bank.buyIn(200, { from: recipientAddress });
    
    expect(await usdcMock.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(0));
    expect(await usdcMock.balanceOf(bank.address)).to.be.bignumber.equal(new BN(100 * 10**6));
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(200));
    expect(await casinoToken.balanceOf(bank.address)).to.be.bignumber.equal(new BN(0));

    await casinoToken.increaseAllowance(bank.address, 100, { from: recipientAddress });

    const receipt = await bank.cashOut(100, { from: recipientAddress });

    expectEvent(receipt, 'CashOut', {
      player: recipientAddress,
      usdcAmount: new BN(50 * 10**6),
      casinoTokenCount: new BN(100),
    });

    expect(await usdcMock.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(50 * 10**6));
    expect(await usdcMock.balanceOf(bank.address)).to.be.bignumber.equal(new BN(50 * 10**6));
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(100));
    expect(await casinoToken.balanceOf(bank.address)).to.be.bignumber.equal(new BN(0));
  });

  it('should revert cash out for 0 Casino Tokens', async () => {
    await expectRevert(bank.cashOut(0, { from: recipientAddress }), 'Positive token withdrawals only');
  });

  it('should transfer CasinoToken and receive USDC for casino cash out', async () => {
    await usdcMock.increaseAllowance(bank.address, 100 * 10**6, { from: recipientAddress });
    await usdcMock.faucet(recipientAddress, 100 * 10**6);

    await bank.casinoBuyIn(anotherAddress, recipientAddress, 200, { from: adminAddress });
    
    expect(await usdcMock.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(0));
    expect(await usdcMock.balanceOf(bank.address)).to.be.bignumber.equal(new BN(100 * 10**6));
    expect(await usdcMock.balanceOf(otherAddress)).to.be.bignumber.equal(new BN(0));
    expect(await casinoToken.balanceOf(anotherAddress)).to.be.bignumber.equal(new BN(200));
    expect(await casinoToken.balanceOf(bank.address)).to.be.bignumber.equal(new BN(0));
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(0));

    const receipt = await bank.casinoCashOut(anotherAddress, recipientAddress, 100, { from: adminAddress });

    expectEvent(receipt, 'CashOut', {
      player: anotherAddress,
      usdcAmount: new BN(50 * 10**6),
      casinoTokenCount: new BN(100),
    });

    expect(await usdcMock.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(50 * 10**6));
    expect(await usdcMock.balanceOf(bank.address)).to.be.bignumber.equal(new BN(50 * 10**6));
    expect(await usdcMock.balanceOf(otherAddress)).to.be.bignumber.equal(new BN(0));
    expect(await casinoToken.balanceOf(anotherAddress)).to.be.bignumber.equal(new BN(100));
    expect(await casinoToken.balanceOf(bank.address)).to.be.bignumber.equal(new BN(0));
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(0));
  });

  it('should revert casino cash out for 0 Casino Tokens', async () => {
    await expectRevert(bank.casinoCashOut(anotherAddress, recipientAddress, 0, { from: adminAddress }), 'Positive token withdrawals only');
  });

  it('should revert casino cash out when called not by the admin', async () => {
    await expectRevert(bank.casinoCashOut(anotherAddress, recipientAddress, 400, { from: otherAddress }), 'Only the admin is allowed to call this operation');
  });
});