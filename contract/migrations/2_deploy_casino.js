const UsdcMock = artifacts.require('UsdcMock.sol');
const CasinoToken = artifacts.require('CasinoToken.sol');
const Bank = artifacts.require('Bank.sol');
const RandomNumberOracle = artifacts.require('RandomNumberOracle.sol');
const Casino = artifacts.require('Casino.sol');

module.exports = async (deployer, network, addresses) => {
  const [bankAdmin, casinoAdmin, randomAdmin, player1, player2, _] = addresses;

  const randomSeed = Math.round(Math.random() * 1000000);

  if (network === 'development' || network == 'develop') {
    await deployer.deploy(UsdcMock);
    const usdcMock = await UsdcMock.deployed();
    await usdcMock.faucet(casinoAdmin, 1000 * 10**6);
    await usdcMock.faucet(player1, 1000 * 10**6);
    await usdcMock.faucet(player2, 1000 * 10**6);

    await deployer.deploy(Bank, usdcMock.address, 2, 1, { from: bankAdmin }); // 2 CasinoToken = 1 USDC
    const bank = await Bank.deployed();

    await deployer.deploy(CasinoToken, { from: bankAdmin });
    const casinoToken = await CasinoToken.deployed();
    await casinoToken.setAdmin(bank.address, { from: bankAdmin });
    await bank.setCasinoToken(casinoToken.address, { from: bankAdmin });

    await deployer.deploy(RandomNumberOracle, randomSeed, { from: randomAdmin });
    const randomNumberGenerator = await RandomNumberOracle.deployed();

    await deployer.deploy(Casino, casinoToken.address, randomNumberGenerator.address, 2, 100, 100, { from: casinoAdmin });
    const casino = await Casino.deployed();

    await usdcMock.approve(bank.address, 250 * 10**6, { from: casinoAdmin }); // Casino buy in
    await bank.casinoBuyIn(casino.address, casinoAdmin, 500);
  } else {
    const BANK_ADMIN_ADDRESS = '';
    const CASINO_ADMIN_ADDRESS = '';
    const RANDOM_ADMIN_ADDRESS = '';
    const USDC_ADDRESS = '';
    
    await deployer.deploy(Bank, USDC_ADDRESS, 2, 1, { from: BANK_ADMIN_ADDRESS }); // 2 CasinoToken = 1 USDC
    const bank = await Bank.deployed();

    await deployer.deploy(CasinoToken, { from: BANK_ADMIN_ADDRESS });
    const casinoToken = await CasinoToken.deployed();
    await casinoToken.setAdmin(bank.address, { from: BANK_ADMIN_ADDRESS });
    await bank.setCasinoToken(casinoToken.address, { from: BANK_ADMIN_ADDRESS });

    await deployer.deploy(RandomNumberOracle, randomSeed, { from: RANDOM_ADMIN_ADDRESS });
    const randomNumberGenerator = await RandomNumberOracle.deployed();
    
    await deployer.deploy(Casino, casinoToken.address, randomNumberGenerator.address, 2, 100, 100, { from: CASINO_ADMIN_ADDRESS });
    const casino = await Casino.deployed();
  }
};