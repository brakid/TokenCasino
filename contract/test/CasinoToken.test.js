const { accounts, contract } = require('@openzeppelin/test-environment');
const [ adminAddress, otherAddress, recipientAddress, _ ] = accounts;
const { BN, expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const CasinoToken = contract.fromArtifact('CasinoToken');

describe('CasinoToken', async () => {
  let casinoToken;
  beforeEach(async () => {
    casinoToken = await CasinoToken.new({ from: adminAddress });
  });

  it('should list the correct decimals', async () => {
    expect(await casinoToken.decimals()).to.be.bignumber.equal(new BN(0));
  });

  it('should correctly determine who is the admin', async () => {
    expect(await casinoToken.isAdmin({ from: adminAddress })).to.be.true;
    expect(await casinoToken.isAdmin()).to.be.false;
    expect(await casinoToken.isAdmin({ from: otherAddress })).to.be.false;
  });

  it('should correctly hand over the admin', async () => {
    expect(await casinoToken.isAdmin({ from: adminAddress })).to.be.true;
    expect(await casinoToken.isAdmin({ from: otherAddress })).to.be.false;

    await casinoToken.setAdmin(otherAddress, { from: adminAddress });

    expect(await casinoToken.isAdmin({ from: adminAddress })).to.be.false;
    expect(await casinoToken.isAdmin({ from: otherAddress })).to.be.true;
  });

  it('should reject when the new admin is the 0x0 address', async () => {
    await expectRevert(casinoToken.setAdmin(constants.ZERO_ADDRESS, { from: adminAddress }), 'New admin must not be the 0x0 address');
  });

  it('should reject when the caller is not the admin', async () => {
    await expectRevert(casinoToken.setAdmin(recipientAddress, { from: otherAddress }), 'Only the admin is allowed to call this operation');
    await expectRevert(casinoToken.mint(recipientAddress, 10, { from: otherAddress }), 'Only the admin is allowed to call this operation');
    await expectRevert(casinoToken.burn(recipientAddress, 10, { from: otherAddress }), 'Only the admin is allowed to call this operation');
  });

  it('should mint when called by admin', async () => {
    const receipt = await casinoToken.mint(recipientAddress, 10, { from: adminAddress });
    
    expectEvent(receipt, 'Transfer', {
      from: constants.ZERO_ADDRESS,
      to: recipientAddress,
      value: new BN(10),
    });
    
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(10));
  });

  it('should burn when called by admin', async () => {
    await casinoToken.mint(recipientAddress, 10, { from: adminAddress });

    const receipt = await casinoToken.burn(recipientAddress, 10, { from: adminAddress });
    
    expectEvent(receipt, 'Transfer', {
      from: recipientAddress,
      to: constants.ZERO_ADDRESS,
      value: new BN(10),
    });
    
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(0));
  });

  it('should reject when burn amount is larger than balance', async () => {
    await casinoToken.mint(recipientAddress, 1, { from: adminAddress });
    
    await expectRevert(casinoToken.burn(recipientAddress, 10, { from: adminAddress }), 'ERC20: burn amount exceeds balance');
    
    expect(await casinoToken.balanceOf(recipientAddress)).to.be.bignumber.equal(new BN(1));
  });
});