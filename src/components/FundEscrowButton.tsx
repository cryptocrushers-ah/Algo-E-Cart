"use client";

import { useWallet } from "@/lib/wallet/WalletContext";
import axios from "axios";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface FundEscrowButtonProps {
  appId: number;
  amount: number;
}

export default function FundEscrowButton({ appId, amount }: FundEscrowButtonProps) {
  const { peraWallet, accountAddress } = useWallet();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<
    "idle" | "generating" | "signing" | "submitting" | "success" | "error"
  >("idle");

  const [txId, setTxId] = useState("");

  async function fundEscrow() {
    if (!accountAddress) {
      toast.error("Connect wallet first!");
      return;
    }

    setOpen(true);
    setStep("generating");

    try {
      // Step 1: Generate transaction
      const res = await axios.post("/api/escrow/fund", {
        buyer_address: accountAddress,
        app_id: appId,
        amount,
      });

      const unsignedTxn = res.data.txn;
      const binaryTxn = new Uint8Array(Buffer.from(unsignedTxn, "base64"));

      setStep("signing");

      // Step 2: User signs in Pera Wallet
      const signed = await peraWallet.signTransaction([binaryTxn]);

      setStep("submitting");

      // Step 3: Submit signed txn to backend
      const submitRes = await axios.post("/api/escrow/fund/submit", {
        signed_txn: Buffer.from(signed[0]).toString("base64"),
      });

      setTxId(submitRes.data.txid);
      setStep("success");
      toast.success("Fund escrow successful!");

    } catch (err) {
      console.error(err);
      setStep("error");
      toast.error("Escrow funding failed");
    }
  }

  return (
    <>
      <Button className="bg-black text-white" onClick={fundEscrow}>
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
            </div>
          )}

          {/* ERROR */}
          {step === "error" && (
            <div className="flex flex-col items-center p-5">
              <AlertTriangle className="h-12 w-12 text-red-600" />
              <p className="mt-3 font-semibold text-red-600">
                Something went wrong!
              </p>
              <Button
                className="mt-4 bg-black text-white"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
