// src/lib/escrow/fundFlow.ts
import algosdk from "algosdk";

/**
 * Fund an escrow smart contract using AlgoSigner
 * This sends:
 *  1️⃣ Buyer → Escrow: Payment transaction
 *  2️⃣ Buyer → App: Application call ("fund" method)
 *  grouped atomically.
 */
export async function BuyNowModal(
  apiBase: string,
  orderId: number,
  connectedAddress: string
) {
  console.log("🧠 Preparing escrow funding for order:", orderId);

  // === 1️⃣ Fetch setup data from backend ===
  const prepareRes = await fetch(`${apiBase}/api/escrow/prepare_fund/${orderId}`);
  const prepareJson = await prepareRes.json();

  if (!prepareRes.ok)
    throw new Error(prepareJson.detail || "Failed to get funding info");

  const { app_id, escrow_address, amount_micro, algod_params } = prepareJson;

  console.log("Fetched funding data:", {
    app_id,
    escrow_address,
    amount_micro,
    algod_params,
  });

  // === 2️⃣ Normalize SuggestedParams ===
  // Use algod_params from backend instead of querying algodClient directly
  const rawParams = algod_params;

  const suggestedParams = {
    fee: Number(rawParams.fee),
    firstRound: Number(rawParams.firstRound || rawParams["first-round"]),
    lastRound: Number(rawParams.lastRound || rawParams["last-round"]),
    genesisHash: rawParams.genesisHash || rawParams["genesis-hash"],
    genesisID: rawParams.genesisID || rawParams["genesis-id"],
    flatFee: true
};


  console.log("Using suggested params:", suggestedParams);

  // === 3️⃣ Build grouped transactions ===
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: connectedAddress,
    to: escrow_address,
    amount: amount_micro,
    suggestedParams
} as any);

  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    from: connectedAddress,
    appIndex: app_id,
    appArgs: [new Uint8Array(Buffer.from("fund"))],
    suggestedParams,
  } as any);

  const txns = [paymentTxn, appCallTxn];
  algosdk.assignGroupID(txns);

  console.log("📦 Grouped transactions built:", txns);

  // === 4️⃣ Connect & sign with AlgoSigner ===
  const AlgoSigner = (window as any).AlgoSigner;
  if (!AlgoSigner) {
    throw new Error("AlgoSigner not detected. Please install the extension.");
  }

  await AlgoSigner.connect();

  const base64Txns = txns.map((txn) => ({
    txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64"),
  }));

  console.log("🔏 Prepared base64 txns:", base64Txns);

  let signedTxns;
  try {
    signedTxns = await AlgoSigner.signTxn(base64Txns);
  } catch (err) {
    console.error("❌ Signing failed:", err);
    throw new Error("User rejected or signing failed");
  }

  const signedBlobs = signedTxns.map((t: any) => t.blob);

  // === 5️⃣ Broadcast signed txns via backend ===
  const broadcastRes = await fetch(`${apiBase}/api/algod/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signed_txns: signedBlobs }),
  });

  const broadcastJson = await broadcastRes.json();
  if (!broadcastRes.ok)
    throw new Error(broadcastJson.detail || "Broadcast failed");

  console.log("✅ Escrow funding successful:", broadcastJson);
  return broadcastJson;
}
