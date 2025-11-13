'use client';
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useWallet } from "@/lib/wallet/WalletContext";
import algosdk from "algosdk";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function BuyPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const params = useParams();
  const orderId = params.id as string;

  const { accountAddress, peraWallet, algodClient } = useWallet();
  const [order, setOrder] = useState<any>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFunding, setIsFunding] = useState(false);
  const [buyerForm, setBuyerForm] = useState({ name: "", email: "", address: "" });

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
        if (found?.buyer_name) setBuyerForm({ name: found.buyer_name, email: found.buyer_email || "", address: found.buyer_address || ""});
      } catch (e:any) {
        toast.error(e.message || "Failed");
      } finally { setLoading(false); }
    };
    fetchData();
  }, [orderId]);

  const handleFundEscrow = useCallback(async () => {
    if (!accountAddress) { toast.error("Connect wallet"); return; }
    if (!orderDetails) { toast.error("Order details missing"); return; }
    if (!algodClient || !peraWallet) { toast.error("Wallet/node missing"); return; }

    try {
      setIsFunding(true);
      toast.loading("Fetching suggested params from node...");
      const sp: any = await algodClient.getTransactionParams().do();
      console.log("RAW SP", sp);

      // Use the raw params exactly; algosdk expects genesisHash as bytes/Uint8Array from node
      // Build suggested params safely with TS support
      const suggestedParams = {
        flatFee: true,
        fee: 1000,
      
        firstRound:
          (sp as any).firstRound ??
          (sp as any)["first-round"] ??
          (sp as any).first,
      
        lastRound:
          (sp as any).lastRound ??
          (sp as any)["last-round"] ??
          (sp as any).last,
      
        genesisHash:
          (sp as any).genesisHash ??
          (sp as any)["genesis-hash"],
      
        genesisID:
          (sp as any).genesisID ??
          (sp as any)["genesis-id"] ??
          (sp as any).gen,
      };
      



      const from = String(accountAddress).trim();
      const to = String(orderDetails.escrow_address).trim();
      console.log("FROM", from, "TO", to, "PARAMS", suggestedParams);

      // Build transactions
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from, to, amount: Number(orderDetails.amount_micro), suggestedParams
      }as any);

      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from,
        appIndex: Number(orderDetails.app_id),
        appArgs: [new TextEncoder().encode("fund")],
        suggestedParams
      }as any);

      algosdk.assignGroupID([paymentTxn, appCallTxn]);

      toast.loading("Please approve in Pera Wallet...");
      const signed = await peraWallet.signTransaction([
        [{ txn: paymentTxn }],
        [{ txn: appCallTxn }]
      ]);
      console.log("SIGNED", signed);

      // normalize signed -> Uint8Array[]
      const normalized: Uint8Array[] = [];
      const flat = signed.flat ? signed.flat() : signed;
      for (const s of flat) {
        if (s instanceof Uint8Array) {
          normalized.push(s);
        } else if (typeof s === "object" && s !== null && "blob" in s && typeof (s as any).blob === "string") {
          const raw = atob((s as any).blob);
          const arr = new Uint8Array(raw.length);
          for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
          normalized.push(arr);
        } else if (typeof s === "string") {
          const raw = atob(s);
          const arr = new Uint8Array(raw.length);
          for (let i=0;i<raw.length;i++) arr[i]=raw.charCodeAt(i);
          normalized.push(arr);
        }
      }

      const sendResp = await algodClient.sendRawTransaction(normalized).do();
      console.log("SEND", sendResp);
      const txId = sendResp.txid || sendResp.txid || sendResp["txid"];
      if (!txId) throw new Error("No txid returned");
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      // notify backend
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

  const detailsSaved = !!order.buyer_name;

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div className="card">
        <h2>Checkout: {order.product_name}</h2>
      </div>

      <div className="card">
        <h3>1. Your Details</h3>
        {/* simplified UI - keep your existing components */}
      </div>

      <div className="card">
        <h3>2. Fund Escrow</h3>
        <div><strong>Escrow Address</strong><div className="mono">{orderDetails.escrow_address}</div></div>
        <div><strong>Amount</strong><div>{(orderDetails.amount_micro/1e6).toFixed(6)} ALGO</div></div>
        <Button onClick={handleFundEscrow} disabled={isFunding || !accountAddress}>
          {isFunding ? <Loader2 className="animate-spin" /> : "Fund Escrow Now"}
        </Button>
      </div>
    </div>
  );
}
