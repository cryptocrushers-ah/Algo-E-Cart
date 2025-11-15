"use client";

import React from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/lib/wallet/WalletContext";

export default function ConnectWalletButton() {
  const { connectWallet, disconnectWallet, accountAddress, isConnecting } =
    useWallet();

  const shortAddr = accountAddress
    ? `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`
    : "";

  const handleClick = async () => {
    if (accountAddress) {
      disconnectWallet();
    } else {
      await connectWallet();
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={isConnecting}
      className={`px-5 py-2 rounded-lg font-medium transition-all duration-200
        ${
          accountAddress
            ? "bg-black text-white hover:bg-gray-800"
            : "bg-black text-white hover:bg-gray-800"
        }
        disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isConnecting
        ? "Connecting..."
        : accountAddress
        ? `Connected: ${shortAddr}`
        : "Connect Wallet"}
    </motion.button>
  );
}
