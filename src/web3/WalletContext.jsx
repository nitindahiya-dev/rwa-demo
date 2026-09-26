import { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import {
  connectWallet,
  getMetaMaskProvider,
  NETWORK_CHAIN_ID,
} from './config';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState('');

  const syncWallet = async () => {
    try {
      const ethereum = getMetaMaskProvider();

      const accounts = await ethereum.request({
        method: 'eth_accounts',
      });

      const browserProvider = new ethers.providers.Web3Provider(
        ethereum,
        'any'
      );

      const network = await browserProvider.getNetwork();

      setProvider(browserProvider);
      setChainId(Number(network.chainId));
      setAccount(accounts[0] || null);
      setError('');
    } catch (error) {
      console.error('Wallet sync failed:', error);
    }
  };

  const connect = async () => {
    try {
      setError('');

      const result = await connectWallet();

      setAccount(result.account);
      setChainId(result.chainId);
      setProvider(result.provider);

      return result;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setError(error?.message || 'Wallet connection failed.');
      throw error;
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setChainId(null);
    setError('');
  };

  useEffect(() => {
    let ethereum;

    try {
      ethereum = getMetaMaskProvider();
    } catch {
      return;
    }

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts?.[0] || null);
    };

    const handleChainChanged = async () => {
      await syncWallet();
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    syncWallet();

    return () => {
      ethereum.removeListener(
        'accountsChanged',
        handleAccountsChanged
      );

      ethereum.removeListener(
        'chainChanged',
        handleChainChanged
      );
    };
  }, []);

  const isCorrectNetwork =
    chainId === NETWORK_CHAIN_ID;

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        provider,
        error,
        connect,
        disconnect,
        isCorrectNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error(
      'useWallet must be used inside WalletProvider'
    );
  }

  return context;
}
