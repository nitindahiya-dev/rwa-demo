import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import {
  FiCheckCircle,
  FiDatabase,
  FiHome,
} from 'react-icons/fi';

import { useWallet } from '../web3/WalletContext';
import {
  CONTRACTS,
  NETWORK_CHAIN_ID,
  PROPERTY_TOKEN_ABI,
  REGISTRY_ABI,
  ASSET_ID,
} from '../web3/config';

function shortAddress(address) {
  if (!address) return '—';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Admin() {
  const {
    account,
    provider,
    connect,
    isCorrectNetwork,
  } = useWallet();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    supply: '0',
    symbol: '—',
    custodian: null,
    active: false,
  });

  useEffect(() => {
    async function load() {
      if (!provider || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const token = new ethers.Contract(
          CONTRACTS.propertyToken,
          PROPERTY_TOKEN_ABI,
          provider
        );

        const [supply, symbol] = await Promise.all([
          token.totalSupply(),
          token.symbol(),
        ]);

        setData({
          supply: ethers.utils.formatUnits(supply, 18),
          symbol,
          custodian: null,
          active: true,
        });
      } catch (err) {
        console.error(err);
        setError(
          err?.reason ||
          err?.message ||
          'Unable to load on-chain data.'
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [provider, account]);

  if (!account) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="container py-16">
          <div className="max-w-xl mx-auto bg-white border rounded-2xl p-10 text-center shadow-sm">
            <FiHome
              className="mx-auto text-primary-600 mb-5"
              size={40}
            />

            <h1 className="text-3xl font-bold text-secondary-900">
              Admin Dashboard
            </h1>

            <p className="text-secondary-600 mt-3 mb-7">
              Connect your wallet to view the platform.
            </p>

            <button
              className="btn"
              onClick={connect}
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="container py-16">
          <div className="max-w-xl mx-auto bg-white border rounded-2xl p-10 text-center shadow-sm">
            <h1 className="text-2xl font-bold">
              Switch to Base Sepolia
            </h1>

            <p className="text-secondary-600 mt-3">
              This dashboard uses Base Sepolia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container py-10">

        <p className="text-sm text-primary-600 font-medium">
          Platform
        </p>

        <h1 className="text-4xl font-bold text-secondary-900 mt-1">
          Admin Dashboard
        </h1>

        <p className="text-secondary-600 mt-2 mb-8">
          On-chain overview of the property RWA platform.
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <FiHome
              className="text-primary-600 mb-5"
              size={25}
            />

            <div className="text-sm text-secondary-500">
              Tokenized Property
            </div>

            <div className="text-2xl font-bold mt-2">
              Modern Villa
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <FiDatabase
              className="text-primary-600 mb-5"
              size={25}
            />

            <div className="text-sm text-secondary-500">
              Token Supply
            </div>

            <div className="text-2xl font-bold mt-2">
              {loading
                ? '...'
                : `${data.supply} ${data.symbol}`}
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <FiCheckCircle
              className="text-green-600 mb-5"
              size={25}
            />

            <div className="text-sm text-secondary-500">
              Asset Status
            </div>

            <div className="text-2xl font-bold mt-2">
              {data.active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-6">
            Platform Details
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-secondary-500">
                Network
              </span>
              <span className="font-semibold">
                Base Sepolia ({NETWORK_CHAIN_ID})
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-secondary-500">
                Connected Wallet
              </span>
              <span className="font-mono">
                {shortAddress(account)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-secondary-500">
                Custodian
              </span>
              <span className="font-mono">
                {shortAddress(data.custodian)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-secondary-500">
                Settlement
              </span>
              <span className="font-mono">
                {shortAddress(CONTRACTS.settlement)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
