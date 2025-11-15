'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const { id } = useParams();
  const router = useRouter();

  const [escrowInfo, setEscrowInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchEscrowDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/escrow/prepare_fund/${id}`);
      if (!res.ok) throw new Error('Unable to load escrow info');
      const data = await res.json();
      setEscrowInfo(data);
    } catch (err: any) {
      toast.error(err.message || 'Error loading payment info');
      router.push('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async () => {
    if (!escrowInfo) return;

    try {
      setProcessing(true);
      toast.loading('🔗 Connecting to blockchain...');
      await new Promise((r) => setTimeout(r, 1500));

      // In future: call AlgoSigner / Pera Wallet to send payment to escrow address

      toast.loading('💰 Funding escrow account...');
      await new Promise((r) => setTimeout(r, 1500));

      // Simulate backend verification call
      const res = await fetch(`${API_BASE}/api/escrow/fund/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          tx_id: 'mock-txid-' + Date.now(),
        }),
      });

      if (!res.ok) throw new Error('Failed to verify funding');
      const data = await res.json();

      toast.success('✅ Escrow funded successfully!');
      router.push('/my-orders');
    } catch (err: any) {
      toast.error(err.message || 'Error funding escrow');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchEscrowDetails();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        Fetching escrow details...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg border border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-primary">
              💳 Confirm Escrow Payment
            </CardTitle>
            <p className="text-muted-foreground">
              Review the details before you fund the escrow smart contract.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {escrowInfo ? (
              <div className="border p-4 rounded-lg bg-muted/30 space-y-2">
                <p>
                  <strong>App ID:</strong> {escrowInfo.app_id}
                </p>
                <p className="break-all">
                  <strong>Escrow Address:</strong>{' '}
                  <span className="text-primary font-mono">
                    {escrowInfo.escrow_address}
                  </span>
                </p>
                <p>
                  <strong>Amount:</strong>{' '}
                  {(escrowInfo.amount_micro / 1_000_000).toFixed(2)} ALGO
                </p>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Make sure to send this exact amount to the escrow address.
                </p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-10">
                No escrow data found.
              </p>
            )}

            <Button
              onClick={handleFund}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" /> Processing...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" /> Fund Escrow
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
