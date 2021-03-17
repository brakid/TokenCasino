import React, { useContext, useState } from 'react';
import { paymentProcessorAddress } from './utils/contracts';
import { useEffect } from 'react';
import { BigNumber, ethers } from 'ethers';
import { Payment, Product, Wallet } from './utils/types';
import { API_URL } from './externals';
import { BlockchainContext, BlockchainContextData } from './App';

export interface GetProductsResponse { 
  prices: BigNumber[], 
  productIds: BigNumber[], 
};

const Store = () => {
  const { blockchain, blockNumber } = useContext<BlockchainContextData>(BlockchainContext);
  const [ products, setProducts ] = useState<Product[]>([]);
  const [ downloadUrl, setDownloadUrl ] = useState<string>();
  const [ downloadedProduct, setDownloadedProduct ] = useState<Product>();
  const [ wallet, setWallet ] = useState<Wallet>();
  const [ error, setError ] = useState<string>();

  useEffect(() => {
    const getProducts = async () => {
      if (blockchain) {
        const { prices, productIds }: GetProductsResponse = await blockchain.paymentProcessor.getProducts();

        const productList = prices.map((price, index) => {
          return { price, productId: productIds[index] };
        });

        setProducts(productList);
        setError('');
      } else {
        setError('No blockchain present');
      }
    };

    const getWallet = async () => {
      if (blockchain) {
        const address = await blockchain.provider.getSigner().getAddress();
        const usdcBalance = await blockchain.usdc.balanceOf(address);
        const ethereumBalance = await blockchain.provider.getSigner().getBalance();
        const allowance = await await blockchain.usdc.allowance(address, paymentProcessorAddress);

        setWallet({ address, usdcBalance, ethereumBalance, allowance });
      }
    };

    getProducts();
    getWallet();
  }, [blockchain, blockNumber]);

  const isBalanceSufficient = (product: Product): boolean => {
    return (!!!wallet || wallet.usdcBalance.lt(product.price)) ? false : true;
  }

  const buy = async (product: Product): Promise<void> => {
    const response = await fetch(API_URL + '/api/getPaymentId/' + product.productId);
    const payment: Payment = await response.json();
    
    try {
      if (wallet?.allowance.lt(product.price)) {
        setError('Allowance too low');
        return;
      }

      const payTransaction = await blockchain?.paymentProcessor.pay(product.price, payment.paymentId, payment.productId);
      await payTransaction.wait();
    } catch (err) {
      setError(err.message + ': ' + JSON.stringify(error));
      console.log(JSON.stringify(error));
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });

    const urlResponse = await fetch(API_URL + '/api/getProductUrl/' + payment.paymentId);
    setDownloadUrl(await urlResponse.json());
    setDownloadedProduct(product);
  };

  const increaseAllowance = async (): Promise<void> => {
    try {
      const usdcTransaction = await blockchain?.usdc.approve(paymentProcessorAddress, ethers.utils.parseEther('1000'));
      await usdcTransaction.wait();
    } catch (err) {
      console.log(JSON.stringify(err));
    }
  };

  return (
    <div>
      { error && (<p>Error: { error }</p>) }
      { wallet && (<p>Wallet address: { wallet.address }, USDC balance: { ethers.utils.formatEther(wallet.usdcBalance) } USDC (Allowance: { ethers.utils.formatEther(wallet.allowance) } USDC), ETH balance: { ethers.utils.formatEther(wallet.ethereumBalance) } ETH</p>) }
      { downloadUrl && downloadedProduct && (<p>Downloaded product: { downloadedProduct.productId.toString() }: <a href={ downloadUrl }>Download link</a> </p>) }
      { wallet && wallet.allowance.isZero() && (<p>Increase allowance: <button onClick={ (e) => increaseAllowance() }>Increase allowance</button> </p>)}
      <ul>
        { products.map((product, index) => {
          return (<li key={ index }>Product: { product.productId.toString() } - Price: { ethers.utils.formatEther(product.price.toString()) } USDC + Gas fees { isBalanceSufficient(product) && (<button onClick={ (e) => buy(product) }>Buy</button>) }{ !!!isBalanceSufficient(product) && (<b>No sufficient USDC balance</b>) }</li>)
        }) }
      </ul>
    </div>
  );
}

export default Store;