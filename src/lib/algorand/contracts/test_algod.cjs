const algosdk = require("algosdk");

try {
  const ALGOD_ADDRESS = "https://testnet-api.algonode.cloud";
  const ALGOD_TOKEN = "a"; // Dummy token
  const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_ADDRESS, "");

  console.log("✅ Algod client created:", typeof algodClient);
  algodClient.status().do().then(status => {
    console.log("✅ Node status fetched:", status);
  }).catch(err => {
    console.error("❌ Error fetching status:", err.message);
  });
} catch (e) {
  console.error("💥 Setup error:", e.message);
}
