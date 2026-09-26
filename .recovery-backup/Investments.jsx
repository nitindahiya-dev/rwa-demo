import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowUpRight,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiExternalLink,
  FiHome,
  FiTrendingUp,
  FiCreditCard,
} from 'react-icons/fi';
import { ethers } from 'ethers';

import { useWallet } from '../web3/WalletContext';
import {
  CONTRACTS,
  PAYMENT_TOKEN_ABI,
  PROPERTY_TOKEN_ABI,
  NETWORK_CHAIN_ID,
} from '../web3/config';

const SETTLEMENT_ABI = [
  'event TradeCreated(uint256 indexed tradeId,address indexed buyer,address indexed seller)',
  'event TradeSettled(uint256 indexed tradeId)',
  'function nextTradeId() view returns (uint256)',
  'function trades(uint256) view returns (address buyer,address seller,address assetToken,uint256 assetAmount,address paymentToken,uint256 paymentAmount,bool settled)',
];

const PROPERTY = {
  id: 1,
  title: 'Modern Villa with Pool',
  location: 'Beverly Hills, CA',
  tokenSymbol: 'VILLA425',
  tokenPrice: 10,
  image:
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1000&q=80',
};

const BASESCAN = 'https://sepolia.basescan.org';

function formatAddress(address) {
  if (!address) return '—';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown date';

  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Investments() {
  const { account, provider, chainId, connect } = useWallet();

  const [investments, setInvestments] = useState([]);
  const [rwaBalance, setRwaBalance] = useState('0');
  const [paymentBalance, setPaymentBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPortfolio = useCallback(async () => {
    if (!provider || !account) {
      setInvestments([]);
      setRwaBalance('0');
      setPaymentBalance('0');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const propertyToken = new ethers.Contract(
        CONTRACTS.propertyToken,
        PROPERTY_TOKEN_ABI,
  NETWORK_CHAIN_ID,
        provider
      );

      const paymentToken = new ethers.Contract(
        CONTRACTS.paymentToken,
        PAYMENT_TOKEN_ABI,
        provider
      );

      const settlement = new ethers.Contract(
        CONTRACTS.settlement,
        SETTLEMENT_ABI,
        provider
      );

      const [rwa, payment] = await Promise.all([
        propertyToken.balanceOf(account),
        paymentToken.balanceOf(account),
      ]);

      setRwaBalance(
        Number(ethers.utils.formatUnits(rwa, 18)).toString()
      );

      setPaymentBalance(
        Number(ethers.utils.formatUnits(payment, 18)).toString()
      );

      // Read trades directly from the settlement contract.
      // This avoids large eth_getLogs requests that can be rejected
      // by public Base Sepolia RPC endpoints.
      const tradeCount = await settlement.nextTradeId();
      const records = [];

      for (let i = 0; i < tradeCount.toNumber(); i++) {
        const trade = await settlement.trades(i);

        if (
          trade.buyer.toLowerCase() !== account.toLowerCase()
        ) {
          continue;
        }

        records.push({
          tradeId: i.toString(),
          buyer: trade.buyer,
          seller: trade.seller,
          assetToken: trade.assetToken,
          assetAmount: trade.assetAmount,
          paymentToken: trade.paymentToken,
          paymentAmount: trade.paymentAmount,
          settled: trade.settled,
          txHash: null,
          blockNumber: null,
          timestamp: null,
        });
      }

      records.sort(
        (a, b) => Number(b.tradeId) - Number(a.tradeId)
      );

      setInvestments(records);
    } catch (err) {
      console.error('Portfolio load failed:', err);
      setError(
        err?.reason ||
          err?.message ||
          'Unable to load your investments.'
      );
    } finally {
      setLoading(false);
    }
  }, [provider, account]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const totalInvested = investments.reduce(
    (sum, investment) =>
      sum +
      Number(
        ethers.utils.formatUnits(
          investment.paymentAmount,
          18
        )
      ),
    0
  );

  const totalTokensBought = investments.reduce(
    (sum, investment) =>
      sum +
      Number(
        ethers.utils.formatUnits(
          investment.assetAmount,
          18
        )
      ),
    0
  );

  if (!account) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="container py-16">
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-5">
              <FiCreditCard size={28} />
            </div>

            <h1 className="text-3xl font-bold text-secondary-900">
              My Investments
            </h1>

            <p className="text-secondary-600 mt-3 mb-7">
              Connect your wallet to view your RWA portfolio and
              investment history.
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

  if (chainId !== NETWORK_CHAIN_ID) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="container py-16">
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border p-10 text-center">
            <h1 className="text-2xl font-bold text-secondary-900">
              Switch to Base Sepolia
            </h1>

            <p className="text-secondary-600 mt-3">
              Your wallet is connected, but this portfolio is
              currently configured for Base Sepolia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container py-10">

        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
          <div>
            <p className="text-sm text-primary-600 font-medium">
              Portfolio
            </p>

            <h1 className="text-4xl font-bold text-secondary-900 mt-1">
              My Investments
            </h1>

            <p className="text-secondary-600 mt-2">
              Track your tokenized real-estate positions and
              on-chain investment history.
            </p>
          </div>

          <div className="bg-white border rounded-xl px-4 py-3">
            <div className="text-xs text-secondary-500">
              Connected wallet
            </div>
            <div className="font-mono font-semibold text-secondary-900 mt-1">
              {formatAddress(account)}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-secondary-500">
                RWA Holdings
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <FiHome />
              </div>
            </div>

            <div className="text-3xl font-bold text-secondary-900 mt-5">
              {formatNumber(rwaBalance)}
            </div>

            <div className="text-sm text-secondary-500 mt-1">
              VILLA425
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-secondary-500">
                Total Invested
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <FiDollarSign />
              </div>
            </div>

            <div className="text-3xl font-bold text-secondary-900 mt-5">
              {formatNumber(totalInvested)}
            </div>

            <div className="text-sm text-secondary-500 mt-1">
              mUSDC
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-secondary-500">
                Tokens Purchased
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <FiTrendingUp />
              </div>
            </div>

            <div className="text-3xl font-bold text-secondary-900 mt-5">
              {formatNumber(totalTokensBought)}
            </div>

            <div className="text-sm text-secondary-500 mt-1">
              VILLA425
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-secondary-500">
                Available Cash
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FiCreditCard />
              </div>
            </div>

            <div className="text-3xl font-bold text-secondary-900 mt-5">
              {formatNumber(paymentBalance)}
            </div>

            <div className="text-sm text-secondary-500 mt-1">
              mUSDC
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

              <div className="px-6 py-5 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-secondary-900">
                    Your Investments
                  </h2>
                  <p className="text-sm text-secondary-500 mt-1">
                    Purchases recorded on Base Sepolia
                  </p>
                </div>

                <button
                  onClick={loadPortfolio}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              {loading && investments.length === 0 ? (
                <div className="p-10 text-center text-secondary-500">
                  Loading your on-chain investments...
                </div>
              ) : investments.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="text-secondary-500">
                    No investments found for this wallet.
                  </div>

                  <Link
                    to="/properties/1"
                    className="btn inline-flex mt-5"
                  >
                    Browse Property
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {investments.map((investment) => {
                    const tokens = Number(
                      ethers.utils.formatUnits(
                        investment.assetAmount,
                        18
                      )
                    );

                    const payment = Number(
                      ethers.utils.formatUnits(
                        investment.paymentAmount,
                        18
                      )
                    );

                    return (
                      <div
                        key={`${investment.tradeId}-${investment.txHash}`}
                        className="p-6"
                      >
                        <div className="flex flex-col lg:flex-row gap-5">

                          <img
                            src={PROPERTY.image}
                            alt={PROPERTY.title}
                            className="w-full lg:w-40 h-28 object-cover rounded-xl"
                          />

                          <div className="flex-1">

                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-lg text-secondary-900">
                                    {PROPERTY.title}
                                  </h3>

                                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 flex items-center gap-1">
                                    <FiCheckCircle size={12} />
                                    Confirmed
                                  </span>
                                </div>

                                <p className="text-sm text-secondary-500 mt-1">
                                  {PROPERTY.location}
                                </p>
                              </div>

                              <div className="text-sm text-secondary-500 flex items-center gap-1">
                                <FiClock size={14} />
                                On-chain Trade #{investment.tradeId}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">

                              <div>
                                <div className="text-xs text-secondary-500">
                                  Tokens
                                </div>
                                <div className="font-semibold mt-1">
                                  {formatNumber(tokens)}{' '}
                                  VILLA425
                                </div>
                              </div>

                              <div>
                                <div className="text-xs text-secondary-500">
                                  Invested
                                </div>
                                <div className="font-semibold mt-1">
                                  {formatNumber(payment)} mUSDC
                                </div>
                              </div>

                              <div>
                                <div className="text-xs text-secondary-500">
                                  Price / Token
                                </div>
                                <div className="font-semibold mt-1">
                                  {payment / tokens || PROPERTY.tokenPrice}{' '}
                                  mUSDC
                                </div>
                              </div>

                              <div>
                                <div className="text-xs text-secondary-500">
                                  Trade ID
                                </div>
                                <div className="font-mono font-semibold mt-1">
                                  #{investment.tradeId}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-5">

                              <Link
                                to={`/properties/${PROPERTY.id}`}
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                              >
                                View Property
                                <FiArrowUpRight size={14} />
                              </Link>

                              {investment.txHash && (
                                <a
                                  href={`${BASESCAN}/tx/${investment.txHash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium text-secondary-700 hover:text-primary-600 inline-flex items-center gap-1"
                                >
                                  View on BaseScan
                                  <FiExternalLink size={14} />
                                </a>
                              )}
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl border shadow-sm p-6 sticky top-6">

              <h2 className="text-xl font-bold text-secondary-900">
                Portfolio Snapshot
              </h2>

              <div className="mt-6 space-y-5">

                <div className="flex items-center justify-between">
                  <span className="text-secondary-500">
                    Property
                  </span>
                  <span className="font-semibold">
                    {PROPERTY.title}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-secondary-500">
                    Holdings
                  </span>
                  <span className="font-semibold">
                    {formatNumber(rwaBalance)} VILLA425
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-secondary-500">
                    Last trade price
                  </span>
                  <span className="font-semibold">
                    {investments[0]
                      ? (
                          Number(
                            ethers.utils.formatUnits(
                              investments[0].paymentAmount,
                              18
                            )
                          ) /
                          Number(
                            ethers.utils.formatUnits(
                              investments[0].assetAmount,
                              18
                            )
                          )
                        ).toLocaleString()
                      : PROPERTY.tokenPrice}{' '}
                    mUSDC
                  </span>
                </div>

                <div className="border-t pt-5">
                  <div className="text-sm text-secondary-500">
                    Network
                  </div>
                  <div className="font-semibold mt-1">
                    Base Sepolia
                  </div>
                </div>

                <div>
                  <div className="text-sm text-secondary-500">
                    Wallet
                  </div>
                  <div className="font-mono text-sm font-semibold mt-1 break-all">
                    {account}
                  </div>
                </div>
              </div>

              <Link
                to="/properties/1"
                className="btn w-full mt-7 inline-flex justify-center"
              >
                Invest More
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Investments;
