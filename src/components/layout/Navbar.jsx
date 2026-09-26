import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useWallet } from '../../web3/WalletContext';

function shortAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { account, connect, disconnect, isCorrectNetwork, error } = useWallet();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Properties', href: '/properties' },
    { name: 'My Investments', href: '/investments' },
    { name: 'About', href: '/about' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Blog', href: '/blog' },
  ];

  const handleWallet = async () => {
    if (account) {
      disconnect();
      return;
    }

    await connect();
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <svg width="30" height="35" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="20" r="10" stroke="#0682ff"/>
                <circle cx="15" cy="20" r="6" stroke="#0682ff" strokeWidth="3"/>
              </svg>
              <span className="text-2xl font-bold text-primary-600 mt-1.5">
                DreamProperty
              </span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-secondary-600 hover:text-primary-600 px-3 py-2 text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}

            <button
              className="btn"
              onClick={handleWallet}
              title={error || undefined}
            >
              {account ? shortAddress(account) : 'Connect'}
            </button>
          </div>

          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="text-secondary-600 hover:text-primary-600"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-secondary-600 hover:text-primary-600 hover:bg-primary-50"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <button
                className="block px-3 py-2 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 w-full"
                onClick={handleWallet}
              >
                {account ? shortAddress(account) : 'Connect'}
              </button>

              {account && (
                <div className="px-3 py-2 text-sm">
                  <div className={isCorrectNetwork ? 'text-green-600' : 'text-red-600'}>
                    {isCorrectNetwork
                      ? 'Hardhat Local Network'
                      : 'Wrong network'}
                  </div>
                  {error && <div className="text-red-600 mt-1">{error}</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
