import { ethers } from 'ethers';
import { DEPLOYMENT } from './deployment';

export const NETWORK_CHAIN_ID = Number(DEPLOYMENT.chainId);

export const BASE_SEPOLIA_RPC_URL = 'https://sepolia.base.org';
export const BASESCAN_URL = 'https://sepolia.basescan.org';

export const CONTRACTS = {
  whitelist: DEPLOYMENT.whitelist,
  propertyToken: DEPLOYMENT.propertyToken,
  paymentToken: DEPLOYMENT.paymentToken,
  registry: DEPLOYMENT.registry,
  settlement: DEPLOYMENT.settlement,
};

export const ASSET_ID = DEPLOYMENT.assetId;

export const PROPERTY_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export const PAYMENT_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner,address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export const REGISTRY_ABI = [
  'function getAsset(bytes32 assetId) view returns (tuple(bytes32 id,address token,address custodian,string metadataURI,bool active))',
];

export const SETTLEMENT_ABI = [
  'function buyAsset(address seller,address assetToken,uint256 assetAmount,address paymentToken,uint256 paymentAmount) returns (uint256)',
];

function getMetaMaskProvider() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed.');
  }

  const providers = window.ethereum.providers;

  if (Array.isArray(providers)) {
    const metamask = providers.find(
      (provider) => provider.isMetaMask && !provider.isPhantom
    );

    if (metamask) {
      return metamask;
    }
  }

  if (window.ethereum.isMetaMask && !window.ethereum.isPhantom) {
    return window.ethereum;
  }

  throw new Error('MetaMask provider not found.');
}

export async function getBrowserProvider() {
  return new ethers.providers.Web3Provider(
    getMetaMaskProvider(),
    'any'
  );
}

export async function connectWallet() {
  const ethereum = getMetaMaskProvider();

  const provider = new ethers.providers.Web3Provider(
    ethereum,
    'any'
  );

  await ethereum.request({
    method: 'eth_requestAccounts',
  });

  const targetChainId =
    `0x${NETWORK_CHAIN_ID.toString(16)}`;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
  } catch (error) {
    if (error?.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: targetChainId,
          chainName: 'Base Sepolia',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: [BASE_SEPOLIA_RPC_URL],
          blockExplorerUrls: [BASESCAN_URL],
        }],
      });
    } else {
      throw error;
    }
  }

  const signer = provider.getSigner();
  const account = await signer.getAddress();
  const network = await provider.getNetwork();

  if (Number(network.chainId) !== NETWORK_CHAIN_ID) {
    throw new Error(
      `Wrong network. Expected ${NETWORK_CHAIN_ID}, got ${network.chainId}`
    );
  }

  return {
    provider,
    signer,
    account,
    chainId: Number(network.chainId),
  };
}

export { getMetaMaskProvider };
