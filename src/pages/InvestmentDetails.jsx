import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi';

import { useWallet } from '../web3/WalletContext';
import {
  CONTRACTS,
  NETWORK_CHAIN_ID,
  getBrowserProvider,
} from '../web3/config';

const SETTLEMENT_ABI = [
  'function nextTradeId() view returns (uint256)',
  'function trades(uint256) view returns (address buyer,address seller,address assetToken,uint256 assetAmount,address paymentToken,uint256 paymentAmount,bool settled)',
];

const BASESCAN = 'https://sepolia.basescan.org';

export default function InvestmentDetails() {
  const { tradeId } = useParams();
  const { account, chainId } = useWallet();

  const [trade, setTrade] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');

        if (!account) {
          throw new Error('Connect your wallet first.');
        }

        if (chainId !== NETWORK_CHAIN_ID) {
          throw new Error('Please switch to Base Sepolia.');
        }

        const numericTradeId = Number(tradeId);

        if (!Number.isInteger(numericTradeId) || numericTradeId < 0) {
          throw new Error('Invalid investment ID.');
        }

        const provider = await getBrowserProvider();

        const settlement = new ethers.Contract(
          CONTRACTS.settlement,
          SETTLEMENT_ABI,
          provider
        );

        const nextTradeId = await settlement.nextTradeId();
        const totalTrades = nextTradeId.toNumber();

        if (numericTradeId >= totalTrades) {
          throw new Error(
            `Investment #${numericTradeId} does not exist on Base Sepolia.`
          );
        }

        const result = await settlement.trades(numericTradeId);

        if (
          !result ||
          !result.buyer ||
          result.buyer === ethers.constants.AddressZero
        ) {
          throw new Error(
            `Investment #${numericTradeId} has no recorded trade.`
          );
        }

        setTrade(result);
      } catch (err) {
        console.error('Investment details load failed:', err);

        setError(
          err?.reason ||
          err?.message ||
          'Unable to load investment.'
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [tradeId, account, chainId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="container py-16">
          <div className="bg-white border rounded-2xl p-10 text-center">
            <div className="text-sm text-secondary-500">
              Loading on-chain investment
            </div>
            <div className="text-2xl font-bold mt-2">
              Investment #{tradeId}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="container py-16">
          <div className="bg-white border rounded-2xl p-8">
            <div className="text-sm text-primary-600 font-medium">
              Investment #{tradeId}
            </div>

            <h1 className="text-3xl font-bold mt-2">
              Investment not found
            </h1>

            <p className="text-red-500 mt-4 break-words">
              {error || 'No investment data was found.'}
            </p>

            <Link
              to="/investments"
              className="btn inline-flex mt-7"
            >
              <FiArrowLeft />
              Back to Investments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const assetAmount = Number(
    ethers.utils.formatUnits(trade.assetAmount, 18)
  );

  const paymentAmount = Number(
    ethers.utils.formatUnits(trade.paymentAmount, 18)
  );

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="container py-10">

        <Link
          to="/investments"
          className="inline-flex items-center gap-2 text-primary-600 font-medium mb-6"
        >
          <FiArrowLeft />
          Back to Investments
        </Link>

        <div className="bg-white border rounded-2xl shadow-sm p-8">

          <div className="flex flex-col md:flex-row md:justify-between gap-5">
            <div>
              <p className="text-sm text-primary-600">
                Investment #{tradeId}
              </p>

              <h1 className="text-3xl font-bold mt-1">
                Modern Villa with Pool
              </h1>

              <p className="text-secondary-500 mt-2">
                Recorded on Base Sepolia
              </p>
            </div>

            <div
              className={`px-4 py-2 rounded-full font-medium h-fit ${
                trade.settled
                  ? 'bg-green-50 text-green-600'
                  : 'bg-yellow-50 text-yellow-600'
              }`}
            >
              {trade.settled ? 'Settled' : 'Pending'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

            <div className="border rounded-xl p-5">
              <div className="text-sm text-secondary-500">
                Tokens Received
              </div>

              <div className="text-3xl font-bold mt-2">
                {assetAmount.toLocaleString()} VILLA425
              </div>
            </div>

            <div className="border rounded-xl p-5">
              <div className="text-sm text-secondary-500">
                Amount Invested
              </div>

              <div className="text-3xl font-bold mt-2">
                {paymentAmount.toLocaleString()} mUSDC
              </div>
            </div>

          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="border rounded-xl p-5">
              <div className="text-sm text-secondary-500">
                Buyer
              </div>

              <div className="font-mono text-sm mt-2 break-all">
                {trade.buyer}
              </div>
            </div>

            <div className="border rounded-xl p-5">
              <div className="text-sm text-secondary-500">
                Seller
              </div>

              <div className="font-mono text-sm mt-2 break-all">
                {trade.seller}
              </div>
            </div>

            <div className="border rounded-xl p-5">
              <div className="text-sm text-secondary-500">
                RWA Contract
              </div>

              <div className="font-mono text-sm mt-2 break-all">
                {trade.assetToken}
              </div>
            </div>

            <div className="border rounded-xl p-5">
              <div className="text-sm text-secondary-500">
                Payment Contract
              </div>

              <div className="font-mono text-sm mt-2 break-all">
                {trade.paymentToken}
              </div>
            </div>

          </div>

          <div className="mt-8 flex flex-wrap gap-3">

            <a
              href={`${BASESCAN}/address/${trade.assetToken}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
            >
              RWA Contract
              <FiExternalLink />
            </a>

            <a
              href={`${BASESCAN}/address/${CONTRACTS.settlement}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
            >
              Settlement Contract
              <FiExternalLink />
            </a>

            <Link
              to="/properties/1"
              className="btn inline-flex"
            >
              View Property
            </Link>

          </div>

          {account &&
            trade.buyer.toLowerCase() !== account.toLowerCase() && (
              <p className="text-sm text-secondary-500 mt-6">
                This investment belongs to another wallet.
              </p>
            )}

        </div>
      </div>
    </div>
  );
}
