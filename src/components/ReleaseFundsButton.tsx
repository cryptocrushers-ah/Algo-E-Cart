"use client";

import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";

interface ReleaseFundsButtonProps {
  orderId: string;
}

export default function ReleaseFundsButton({ orderId }: ReleaseFundsButtonProps) {
  const [loading, setLoading] = useState(false);

  async function release() {
    setLoading(true);

    try {
      const res = await axios.post("/api/escrow/admin/release", {
        order_id: orderId,
      });

      toast.success("Funds Released!");

      window.open(
        `https://testnet.explorer.perawallet.app/transaction/${res.data.txid}`,
        "_blank"
      );
    } catch (err) {
      toast.error("Release Failed!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      className="bg-black text-white"
      onClick={release}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="animate-spin w-4 h-4" />
      ) : (
        "Release Funds"
      )}
    </Button>
  );
}
