const { accounts, contract } = require('@openzeppelin/test-environment');
const [ adminAddress, otherAddress, recipientAddress, _ ] = accounts;
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const UsdcMock = contract.fromArtifact('UsdcMock');
const RandomNumberOracle = contract.fromArtifact('RandomNumberOracle');
const CasinoToken = contract.fromArtifact('CasinoToken');
const Casino = contract.fromArtifact('Casino');

describe('Casino', async () => {
  let usdcMock;
  let casino;
  let casinoToken;
  let randomNumberOracle;
  beforeEach(async () => {
    usdcMock = await UsdcMock.new();
    randomNumberOracle = await RandomNumberOracle.new(1, { from: adminAddress });
    casinoToken = await CasinoToken.new(usdcMock.address, 2, 1);
    casino = await Casino.new(casinoToken.address, randomNumberOracle.address, 2, 50, 100, { from: adminAddress });

    await usdcMock.increaseAllowance(casinoToken.address, 100 * 10**6, { from: recipientAddress });
    await usdcMock.faucet(recipientAddress, 100 * 10**6);
    await casinoToken.mint(200, { from: recipientAddress });
    
    await usdcMock.increaseAllowance(casinoToken.address, 100 * 10**6, { from: adminAddress });
    await usdcMock.faucet(adminAddress, 100 * 10**6);
    await casinoToken.mint(200, { from: adminAddress });
    await casinoToken.transfer(casino.address, 200, { from: adminAddress });
  });

  it('should get available casino balance (excluding safety amount)', async () => {
    expect(await casino.getCasinoBalance()).to.be.bignumber.equal(new BN(150));

    expect(await casinoToken.balanceOf(casino.address)).to.be.bignumber.equal(new BN(200));
    expect(await casinoToken.balanceOf(adminAddress)).to.be.bignumber.equal(new BN(0));
  });

  it('should transfer CasinoToken balance to admin', async () => {
    await casino.transferBalance({ from: adminAddress });
    
    expect(await casinoToken.balanceOf(casino.address)).to.be.bignumber.equal(new BN(0));
    expect(await casinoToken.balanceOf(adminAddress)).to.be.bignumber.equal(new BN(200));
  });

  it('should reject transferBalance if not called by the admin', async () => {
    await expectRevert(casino.transferBalance({ from: otherAddress }), 'Only the admin is allowed to call this operation');
  });

  it('should accept bet 1', async () => {
    await casinoToken.increaseAllowance(casino.address, 100, { from: recipientAddress });
    
    const receipt = await casino.play(10, { from: recipientAddress });

    expectEvent(receipt, 'PlayEvent', {
      player: recipientAddress,
      bet: new BN(10),
      payout: new BN(20),
      hasPlayerWon: true,
      casinoCard: new BN(2),
      playerCard: new BN(7),
    });

    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(210));
    expect(await casinoToken.balanceOf(casino.address)).to.be.bignumber.equal(new BN(190));
  });

  it('should accept bet 2', async () => {
    await randomNumberOracle.setSeed(1234, { from: adminAddress });

    await casinoToken.increaseAllowance(casino.address, 100, { from: recipientAddress });
    
    const receipt = await casino.play(10, { from: recipientAddress });

    expectEvent(receipt, 'PlayEvent', {
      player: recipientAddress,
      bet: new BN(10),
      payout: new BN(0),
      hasPlayerWon: false,
      casinoCard: new BN(11),
      playerCard: new BN(6),
    });

    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(190));
    expect(await casinoToken.balanceOf(casino.address)).to.be.bignumber.equal(new BN(210));
  });

  it('should reject bet when amount is too large', async () => {
    await expectRevert(casino.play(101, { from: recipientAddress }), 'Bet is too large');
  });

  it('should reject bet when amount exceeds safety amount', async () => {
    await casino.transferBalance({ from: adminAddress });
    await casinoToken.transfer(casino.address, 60, { from: adminAddress }); // balance: 60
    await expectRevert(casino.play(20, { from: recipientAddress }), 'Bet is too large');
  });

  it('should reject bet when amount exceeds players balance', async () => {
    await expectRevert(casino.play(10, { from: recipientAddress }), 'Bet exceeds players allowance');
  });
});