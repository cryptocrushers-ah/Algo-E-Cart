'use client';
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@/lib/wallet/WalletContext";
import algosdk from "algosdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import UserDetailsForm from "@/components/UserDetailsForm";

export default function BuyPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const params = useParams();
  const orderId = params.id as string;

  const { accountAddress, peraWallet, algodClient } = useWallet();
  const [order, setOrder] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFunding, setIsFunding] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statusRes, prepareRes] = await Promise.all([
          fetch(`${API_BASE}/api/escrow/status`),
          fetch(`${API_BASE}/api/escrow/prepare_fund/${orderId}`),
        ]);
        if (!statusRes.ok || !prepareRes.ok) throw new Error("Failed to load");
        const statusJson = await statusRes.json();
        const prepareJson = await prepareRes.json();
        const found = statusJson.orders.find((o:any) => o.id.toString() === orderId);
        setOrder(found);
        setOrderDetails(prepareJson);
      } catch (e:any) {
        toast.error(e.message || "Failed");
      } finally { setLoading(false); }
    };
    fetchData();
  }, [orderId]);

  // ESCROW FUNDING FUNCTION — unchanged
  const handleFundEscrow = useCallback(async () => {
    if (!accountAddress) { toast.error("Connect wallet"); return; }
    if (!orderDetails) { toast.error("Order details missing"); return; }
    if (!algodClient || !peraWallet) { toast.error("Wallet/node missing"); return; }

    try {
      setIsFunding(true);
      toast.loading("Fetching suggested params...");

      const sp: any = await algodClient.getTransactionParams().do();

      const suggestedParams = {
        flatFee: true,
        fee: 1000,
        firstRound: sp.firstRound ?? sp["first-round"] ?? sp.first,
        lastRound: sp.lastRound ?? sp["last-round"] ?? sp.last,
        genesisHash: sp.genesisHash ?? sp["genesis-hash"],
        genesisID: sp.genesisID ?? sp["genesis-id"]
      };

      const from = String(accountAddress).trim();
      const to = String(orderDetails.escrow_address).trim();

      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from, to, amount: Number(orderDetails.amount_micro), suggestedParams
      } as any);

      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from,
        appIndex: Number(orderDetails.app_id),
        appArgs: [new TextEncoder().encode("fund")],
        suggestedParams
      } as any);

      algosdk.assignGroupID([paymentTxn, appCallTxn]);

      toast.loading("Please approve in Pera Wallet...");
      const signed = await peraWallet.signTransaction([
        [{ txn: paymentTxn }],
        [{ txn: appCallTxn }]
      ]);

      // normalize
      const normalized: Uint8Array[] = [];
      const flat = signed.flat ? signed.flat() : signed;
      for (const s of flat) {
        if (s instanceof Uint8Array) {
          normalized.push(s);
        } else if (s?.blob) {
          const raw = atob(s.blob);
          const arr = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
          normalized.push(arr);
        }
      }

      const sendResp = await algodClient.sendRawTransaction(normalized).do();
      const txId = sendResp.txid;
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      await fetch(`${API_BASE}/api/escrow/fund/verify`, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ order_id: orderId, tx_id: txId })
      });

      toast.success("Escrow funded!");
      setOrder((o:any) => o ? { ...o, status: "FUNDED" } : o);

    } catch (err:any) {
      console.error("FUND ERR", err);
      toast.error(err.message || "Funding failed");
    } finally {
      setIsFunding(false);
    }
  }, [accountAddress, orderDetails, algodClient, peraWallet, orderId]);

  if (loading) return <div className="py-20"><Loader2 className="animate-spin" /></div>;
  if (!order || !orderDetails) return <div className="py-20 text-center">Order not found</div>;

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      
      {/* MAIN HEADER */}
      <div className="bg-white shadow-md p-5 rounded-xl border">
        <h2 className="text-xl font-semibold">Checkout: {order.product_name}</h2>
      </div>

      {/* STEP 1 — USER DETAILS */}
      <div className="bg-white shadow-md p-6 rounded-xl border">
        <h3 className="text-lg font-semibold mb-3">1. Your Details</h3>

        <UserDetailsForm />

      </div>

      {/* STEP 2 — FUND ESCROW */}
      <div className="bg-white shadow-md p-6 rounded-xl border">
        <h3 className="text-lg font-semibold mb-3">2. Fund Escrow</h3>

        <div>
          <strong>Escrow Address</strong>
          <div className="font-mono break-all text-sm">
            {orderDetails.escrow_address}
          </div>
        </div>

        <div className="mt-2">
          <strong>Amount</strong>
          <div>{(orderDetails.amount_micro / 1e6).toFixed(6)} ALGO</div>
        </div>

        <Button
          onClick={handleFundEscrow}
          disabled={isFunding || !accountAddress}
          className="mt-4 w-full"
        >
          {isFunding ? <Loader2 className="animate-spin" /> : "Fund Escrow Now"}
        </Button>
      </div>
    </div>
  );
}
