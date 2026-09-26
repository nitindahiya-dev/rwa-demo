import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Property3D from './pages/Property3D';
import Investments from './pages/Investments';
import Admin from './pages/Admin';
import InvestmentDetails from './pages/InvestmentDetails';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Privacy from './pages/Privacy';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import NotFound from './pages/NotFound';

import { WalletProvider } from './web3/WalletContext';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/properties" element={<Properties />} />
              <Route
                path="/properties/:id"
                element={<PropertyDetail />}
              />
              <Route path="/property-3d" element={<Property3D />} />

              <Route
                path="/investments"
                element={<Investments />}
              />

              <Route
                path="/investments/:tradeId"
                element={<InvestmentDetails />}
              />

              <Route
                path="/admin"
                element={<Admin />}
              />

              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/blog" element={<Blog />} />
              <Route
                path="/blog/:slug"
                element={<BlogPost />}
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
