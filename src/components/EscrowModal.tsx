"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWallet } from '@/contexts/WalletContext';
import { Listing } from '@/lib/types';
import { fundTrade } from '@/lib/escrow';
import { Loader2, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface EscrowModalProps {
  listing: Listing;
  open: boolean;
  onClose: () => void;
}

export default function EscrowModal({ listing, open, onClose }: EscrowModalProps) {
  const { accountAddress, signTransactions, isConnected } = useWallet();
  const [step, setStep] = useState<'init' | 'funding' | 'success'>('init');
  const [loading, setLoading] = useState(false);
  const [escrowAddress, setEscrowAddress] = useState<string>('');
  const [txId, setTxId] = useState<string>('');

  const handlePurchase = async () => {
    if (!isConnected || !accountAddress || !listing.seller) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setLoading(true);
      setStep('init');

      // Create escrow via backend API
      const escrowResponse = await fetch('/api/escrow/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerAddress: listing.seller.walletAddress,
          buyerAddress: accountAddress,
          amount: listing.price
        }),
      });

      if (!escrowResponse.ok) {
        const errorData = await escrowResponse.json();
        throw new Error(errorData.error || 'Failed to initialize escrow');
      }

      const escrowData = await escrowResponse.json();
      const escrow = escrowData.escrowAddress;
      setEscrowAddress(escrow);

      // Create or fetch buyer user
      const userResponse = await fetch(`/api/users?walletAddress=${accountAddress}`);
      let buyerUser;
      if (userResponse.ok) {
        buyerUser = await userResponse.json();
      } else {
        const createUserResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: accountAddress }),
        });
        buyerUser = await createUserResponse.json();
      }

      // Create trade record in database
      const tradeResponse = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          buyerId: buyerUser.id,
          sellerId: listing.sellerId,
          amount: listing.price,
          escrowAddress: escrow,
        }),
      });

      if (!tradeResponse.ok) {
        throw new Error('Failed to create trade');
      }

      setStep('funding');

      // Fund escrow
      const transactionId = await fundTrade(
        accountAddress,
        escrow,
        listing.price,
        signTransactions
      );

      setTxId(transactionId);

      // Update trade status
      const trade = await tradeResponse.json();
      await fetch(`/api/trades/${trade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'funded',
          txnId: transactionId,
        }),
      });

      // Update listing status
      await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sold' }),
      });

      setStep('success');
      toast.success('Purchase successful!');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error instanceof Error ? error.message : 'Purchase failed. Please try again.');
      setStep('init');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Secure Escrow Purchase</span>
          </DialogTitle>
          <DialogDescription>
            Your payment will be held securely in escrow until delivery is confirmed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Purchase Summary */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item</span>
              <span className="font-medium">{listing.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-bold text-lg">{listing.price} ALGO</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seller</span>
              <span>{listing.seller?.username || 'Anonymous'}</span>
            </div>
          </div>

          <Separator />

          {/* Status Steps */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {step === 'init' ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              <div>
                <div className="font-medium">Initialize Escrow</div>
                {escrowAddress && (
                  <div className="text-xs text-muted-foreground">
                    {escrowAddress.slice(0, 10)}...{escrowAddress.slice(-8)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {step === 'funding' ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : step === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
              <div>
                <div className="font-medium">Fund Escrow</div>
                {txId && (
                  <div className="text-xs text-muted-foreground">
                    Tx: {txId.slice(0, 10)}...
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {step === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
              <div className="font-medium">Complete</div>
            </div>
          </div>

          {step === 'success' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Purchase Successful!</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                Your funds are held securely in escrow. The seller will be notified to ship the item.
              </p>
            </div>
          )}

          {/* Security Info */}
          <div className="bg-muted rounded-lg p-3 text-sm">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                <strong>Protected Transaction:</strong> Your payment is held in a secure escrow smart contract until you confirm delivery. Disputes can be raised if needed.
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          {step !== 'success' ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handlePurchase} disabled={loading || !isConnected}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Purchase'
                )}
              </Button>
            </>
          ) : (
            <Button onClick={onClose}>Done</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}