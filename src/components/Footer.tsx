import Link from 'next/link';
import { ShoppingBag, Github, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AlgoMart</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Secure peer-to-peer marketplace powered by Algorand blockchain
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <h3 className="font-semibold mb-3">Marketplace</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-primary transition-colors">
                  Sell an Item
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-primary transition-colors">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://developer.algorand.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Algorand Docs
                </a>
              </li>
              <li>
                <a
                  href="https://perawallet.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Pera Wallet
                </a>
              </li>
              <li>
                <a
                  href="https://testnet.algoexplorer.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  TestNet Explorer
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold mb-3">About</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Built with Next.js & Algorand</li>
              <li>Secure escrow smart contracts</li>
              <li>IPFS decentralized storage</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2024 AlgoMart. Built on Algorand TestNet.
          </p>
          
          <div className="flex items-center space-x-4 text-muted-foreground">
            <a
              href="#"
              className="hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
