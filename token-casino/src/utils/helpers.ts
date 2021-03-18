import { BigNumber, ethers } from 'ethers';

export const LARGE_ALLOWANCE = BigNumber.from('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');

export const formatBalance = (balance: BigNumber, decimals: number): BigNumber => {
  return balance.div(Math.pow(10, decimals));
}

export const getBalance = async (tokenContract: ethers.Contract, address: string, decimals?: number): Promise<BigNumber> => {
  return new Promise(async (resolve) => {
    resolve(formatBalance(await tokenContract.balanceOf(address), decimals || await tokenContract.decimals()));
  })
}