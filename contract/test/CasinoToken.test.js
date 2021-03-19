const { accounts, contract } = require('@openzeppelin/test-environment');
const [ adminAddress, otherAddress, recipientAddress, _ ] = accounts;
const { BN, expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const UsdcMock = contract.fromArtifact('UsdcMock');
const CasinoToken = contract.fromArtifact('CasinoToken');

describe('CasinoToken', async () => {
  let casinoToken;
  let usdcMock;
  beforeEach(async () => {
    usdcMock = await UsdcMock.new();
    casinoToken = await CasinoToken.new(usdcMock.address, 2, 1);
  });

  it('should list the correct decimals', async () => {
    expect(await casinoToken.decimals()).to.be.bignumber.equal(new BN(0));
  });

  it('should mint when called with an amount larger than 0', async () => {
    await usdcMock.increaseAllowance(casinoToken.address, 100 * 10**6, { from: recipientAddress });
    await usdcMock.faucet(recipientAddress, 100 * 10**6);
    
    const receipt = await casinoToken.mint(10, { from: recipientAddress });
    
    expectEvent(receipt, 'Mint', {
      targetAddress: recipientAddress,
      usdcAmount: new BN(5 * 10**6),
      casinoTokenCount: new BN(10),
    });
    
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(10));
    expect(await usdcMock.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(95 * 10**6));
    expect(await usdcMock.balanceOf(casinoToken.address)).to.be.bignumber.equal(new BN(5 * 10 ** 6));
    expect(await casinoToken.totalSupply()).to.be.bignumber.equal(new BN(10));
  });

  it('should reject mint when allowance is not sufficient', async () => {
    await usdcMock.faucet(recipientAddress, 100 * 10**6);

    await expectRevert(casinoToken.mint(10, { from: recipientAddress }), 'ERC20: transfer amount exceeds allowance');
  });

  it('should reject mint when USDC balance is not sufficient', async () => {
    await usdcMock.increaseAllowance(casinoToken.address, 100 * 10**6, { from: recipientAddress });
    
    await expectRevert(casinoToken.mint(10, { from: recipientAddress }), 'ERC20: transfer amount exceeds balance');
  });

  it('should reject mint when called with an amount equal to 0', async () => {
    await expectRevert(casinoToken.mint(0, { from: recipientAddress }), 'Positive token requests only');
  });

  it('should burn when called with an amount larger than 0', async () => {
    await usdcMock.increaseAllowance(casinoToken.address, 100 * 10**6, { from: recipientAddress });
    await usdcMock.faucet(recipientAddress, 100 * 10**6);
    await casinoToken.mint(10, { from: recipientAddress });
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(10));
    expect(await usdcMock.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(95 * 10**6));
    expect(await usdcMock.balanceOf(casinoToken.address)).to.be.bignumber.equal(new BN(5 * 10 ** 6));
    expect(await casinoToken.totalSupply()).to.be.bignumber.equal(new BN(10));

    const receipt = await casinoToken.burn(10, { from: recipientAddress });
    
    expectEvent(receipt, 'Burn', {
      targetAddress: recipientAddress,
      usdcAmount: new BN(5 * 10**6),
      casinoTokenCount: new BN(10),
    });
    
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(0));
    expect(await usdcMock.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(100 * 10**6));
    expect(await usdcMock.balanceOf(casinoToken.address)).to.be.bignumber.equal(new BN(0));
    expect(await casinoToken.totalSupply()).to.be.bignumber.equal(new BN(0));
  });

  it('should reject burn when called with an amount equal to 0', async () => {
    await expectRevert(casinoToken.burn(0, { from: recipientAddress }), 'Positive token withdrawals only');
  });
});