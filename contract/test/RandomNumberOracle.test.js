const { accounts, contract } = require('@openzeppelin/test-environment');
const [ adminAddress, otherAddress, recipientAddress, _ ] = accounts;
const { BN, expectEvent, expectRevert, constants } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const RandomNumberOracle = contract.fromArtifact('RandomNumberOracle');

describe('RandomNumberOracle', async () => {
  let randomNumberOracle;
  beforeEach(async () => {
    randomNumberOracle = await RandomNumberOracle.new(1234567890, { from: adminAddress });
  });

  it('should update the seed when called by the admin', async () => {
    const randomNumber = await randomNumberOracle.getRandomNumber.call();
    const receipt = await randomNumberOracle.setSeed(1234567890, { from: adminAddress });

    expectEvent(receipt, 'SeedUpdated');

    expect(await randomNumberOracle.getRandomNumber.call()).to.be.bignumber.equal(randomNumber);
  });

  it('should reject when the caller is not the admin', async () => {
    await expectRevert(randomNumberOracle.setSeed(1, { from: otherAddress }), 'Only the admin is allowed to call this operation');
  });

  it('should return a random value', async () => {
    expect(await randomNumberOracle.getRandomNumber.call()).to.be.not.null.and.not.be.bignumber.equal(new BN(0));
  });

  it('should return a pair of random values', async () => {
    const { '0': randomNumber1, '1': randomNumber2 } = await randomNumberOracle.getRandomNumberPair.call();
    
    console.log(randomNumber1);
    console.log(randomNumber2);

    expect(randomNumber1).to.be.not.null.and.not.be.bignumber.equal(new BN(0));
    expect(randomNumber2).to.be.not.null.and.not.be.bignumber.equal(new BN(0)).and.not.be.bignumber.equal(randomNumber1);
  });
});