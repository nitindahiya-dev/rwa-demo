import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi';

import { useWallet } from '../web3/WalletContext';
import { CONTRACTS } from '../web3/config';

const SETTLEMENT_ABI = [
  'function trades(uint256) view returns (address buyer,address seller,address assetToken,uint256 assetAmount,address paymentToken,uint256 paymentAmount,bool settled)',
];

const BASESCAN =
  'https://sepolia.basescan.org';

export default function InvestmentDetails() {
  const { tradeId } = useParams();
  const { account } = useWallet();

  const [trade, setTrade] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed.');
        }

        const provider =
          new ethers.providers.Web3Provider(
            window.ethereum,
            'any'
          );

        const settlement =
          new ethers.Contract(
            CONTRACTS.settlement,
            SETTLEMENT_ABI,
            provider
          );

        const result =
          await settlement.trades(tradeId);

        setTrade(result);
      } catch (err) {
        console.error(err);
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
  }, [tradeId]);

  if (loading) {
    return (
      <div className="container py-16 text-center">
        Loading investment...
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="container py-16">
        <div className="bg-white border rounded-2xl p-8">
          <h1 className="text-2xl font-bold">
            Investment not found
          </h1>

          <p className="text-red-600 mt-3">
            {error || 'No investment data.'}
          </p>

          <Link
            to="/investments"
            className="btn inline-flex mt-6"
          >
            Back to Investments
          </Link>
        </div>
      </div>
    );
  }

  const assetAmount =
    Number(
      ethers.utils.formatUnits(
        trade.assetAmount,
        18
      )
    );

  const paymentAmount =
    Number(
      ethers.utils.formatUnits(
        trade.paymentAmount,
        18
      )
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
            </div>

            <div className="px-4 py-2 rounded-full bg-green-50 text-green-700 font-medium h-fit">
              {trade.settled ? 'Settled' : 'Pending'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

            <div className="border rounded-xl p-5">
              <div className="text-sm text-secondary-500">
                Tokens Received
              </div>

              <div className="text-3xl font-bold mt-2">
                {assetAmount} VILLA425
              </div>
            </div>

            <div className="border rounded-xl p-5">
              <div className="text-sm text-secondary-500">
                Amount Invested
              </div>

              <div className="text-3xl font-bold mt-2">
                {paymentAmount} mUSDC
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">

            <div>
              <div className="text-sm text-secondary-500">
                Buyer
              </div>

              <div className="font-mono mt-1 break-all">
                {trade.buyer}
              </div>
            </div>

            <div>
              <div className="text-sm text-secondary-500">
                Seller
              </div>

              <div className="font-mono mt-1 break-all">
                {trade.seller}
              </div>
            </div>

            <div>
              <div className="text-sm text-secondary-500">
                RWA Contract
              </div>

              <div className="font-mono mt-1 break-all">
                {trade.assetToken}
              </div>
            </div>

            <div>
              <div className="text-sm text-secondary-500">
                Payment Contract
              </div>

              <div className="font-mono mt-1 break-all">
                {trade.paymentToken}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">

            <a
              href={`${BASESCAN}/address/${trade.assetToken}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary inline-flex items-center gap-2"
            >
              RWA Contract
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
            trade.buyer.toLowerCase() !==
              account.toLowerCase() && (
              <p className="text-sm text-secondary-500 mt-6">
                This investment belongs to another wallet.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
