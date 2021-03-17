const { accounts, contract } = require('@openzeppelin/test-environment');
const [ adminAddress, otherAddress, recipientAddress, _ ] = accounts;
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const RandomNumberOracle = contract.fromArtifact('RandomNumberOracle');
const CasinoToken = contract.fromArtifact('CasinoToken');
const Casino = contract.fromArtifact('Casino');

describe('Casino', async () => {
  let casino;
  let casinoToken;
  let randomNumberOracle;
  beforeEach(async () => {
    randomNumberOracle = await RandomNumberOracle.new(1, { from: adminAddress });
    casinoToken = await CasinoToken.new({ from: adminAddress });
    casino = await Casino.new(casinoToken.address, randomNumberOracle.address, 2, 50, 100);

    await casinoToken.mint(casino.address, 200, { from: adminAddress });
    await casinoToken.mint(recipientAddress, 200, { from: adminAddress });
  });

  it('should get available casino balance (excluding safety amount)', async () => {
    expect(await casino.getCasinoBalance()).to.be.bignumber.equal(new BN(150));
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
    await casinoToken.burn(casino.address, 200, { from: adminAddress }); // 40 remaining
    await casinoToken.mint(casino.address, 60, { from: adminAddress });
    await expectRevert(casino.play(20, { from: recipientAddress }), 'Bet is too large');
  });

  it('should reject bet when amount exceeds players balance', async () => {
    await expectRevert(casino.play(10, { from: recipientAddress }), 'Bet exceeds players allowance');
  });
});