"use client";

import { useWallet } from "@/lib/wallet/WalletContext";
import axios from "axios";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface FundEscrowButtonProps {
  orderId: string;
  appId: number;
  amountMicro: number;
}

export default function FundEscrowButton({ orderId, appId, amountMicro }: FundEscrowButtonProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const { peraWallet, accountAddress } = useWallet();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<
    "idle" | "generating" | "signing" | "submitting" | "success" | "error"
  >("idle");

  const [txId, setTxId] = useState("");

  async function fundEscrow() {
    if (!accountAddress) {
      toast.error("Please connect wallet first!");
      return;
    }

    setOpen(true);
    setStep("generating");

    try {
      // ------------------------------------------
      // 1️⃣ GENERATE UNSIGNED TX FROM BACKEND
      // ------------------------------------------
      const res = await axios.post(`${API_BASE}/api/escrow/fund/initiate`, {
        buyer_address: accountAddress,
        app_id: appId,
        amount_micro: amountMicro,
        order_id: orderId,
      });

      const unsignedTxnB64 = res.data.unsigned_txn;
      const binaryTxn = new Uint8Array(Buffer.from(unsignedTxnB64, "base64"));

      setStep("signing");

      const signed = await (peraWallet as any).signTransaction([
        binaryTxn
      ]);
      
      
      

      if (!signed || !signed[0]) throw new Error("Signing failed");

      const signedTxnB64 = Buffer.from(signed[0]).toString("base64");

      setStep("submitting");

      // ------------------------------------------
      // 3️⃣ SUBMIT SIGNED TX TO BACKEND
      // ------------------------------------------
      const submitRes = await axios.post(`${API_BASE}/api/escrow/fund/submit`, {
        signed_txn: signedTxnB64,
        order_id: orderId,
      });

      const txid = submitRes.data.txid;
      setTxId(txid);

      setStep("success");
      toast.success("Escrow funded successfully!");

    } catch (err: any) {
      console.error(err);
      setStep("error");
      toast.error(err?.response?.data?.detail || "Escrow funding failed");
    }
  }

  return (
    <>
      <Button className="bg-black text-white w-full" onClick={fundEscrow}>
        Fund Escrow
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Funding Escrow</DialogTitle>
          </DialogHeader>

          {/* GENERATING */}
          {step === "generating" && (
            <div className="flex flex-col items-center p-5">
              <Loader2 className="animate-spin h-10 w-10 text-black" />
              <p className="mt-3 text-sm">Preparing transaction…</p>
            </div>
          )}

          {/* SIGNING */}
          {step === "signing" && (
            <div className="flex flex-col items-center p-5">
              <Loader2 className="animate-spin h-10 w-10 text-black" />
              <p className="mt-3 text-sm">Waiting for Pera Wallet approval…</p>
            </div>
          )}

          {/* SUBMITTING */}
          {step === "submitting" && (
            <div className="flex flex-col items-center p-5">
              <Loader2 className="animate-spin h-10 w-10 text-black" />
              <p className="mt-3 text-sm">Submitting to Algorand…</p>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <div className="flex flex-col items-center p-5">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <p className="mt-3 font-semibold">Escrow Funded Successfully!</p>

              <a
                className="text-blue-600 underline text-sm mt-2"
                href={`https://testnet.explorer.perawallet.app/transaction/${txId}`}
                target="_blank"
              >
                View on Explorer
              </a>

              <Button className="mt-4 bg-black text-white" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div className="flex flex-col items-center p-5">
              <AlertTriangle className="h-12 w-12 text-red-600" />
              <p className="mt-3 font-semibold text-red-600">
                Something went wrong!
              </p>
              <Button className="mt-4 bg-black text-white" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
