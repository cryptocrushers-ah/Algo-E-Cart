const algosdk = require("algosdk");

async function deploy() {
  try {
    const ALGOD_ADDRESS = "https://testnet-api.algonode.cloud";
    const ALGOD_TOKEN = "a"; // dummy token for algonode

    const CREATOR_MNEMONIC =
      process.env.CREATOR_MNEMONIC ||
      "tackle alley arrest news record reject extend donkey razor web slim chaos chuckle olive silk scale minor absent empty shrimp next favorite floor ability slush";

    const creator = algosdk.mnemonicToSecretKey(CREATOR_MNEMONIC);
    const creatorAddress = creator.addr;
    console.log("👤 Creator Address:", creatorAddress);
    console.log("🧩 isValidAddress:", algosdk.isValidAddress(creatorAddress));

    const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_ADDRESS, "");

    // Minimal TEAL programs
    const approvalProgramSource = `#pragma version 9
int 1
return
`;
    const clearProgramSource = `#pragma version 9
int 1
return
`;

    const compile = async (src) => {
      const res = await algodClient.compile(src).do();
      return new Uint8Array(Buffer.from(res.result, "base64"));
    };

    const approvalProgram = await compile(approvalProgramSource);
    const clearProgram = await compile(clearProgramSource);
    console.log("✅ TEAL compiled successfully");

    const params = await algodClient.getTransactionParams().do();
    params.flatFee = true;
    params.fee = 1000;
    console.log("✅ Params ready:", params);

    // ✅ Use sender (not from)
    const txn = algosdk.makeApplicationCreateTxnFromObject({
      sender: creatorAddress,
      suggestedParams: params,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram,
      clearProgram,
      numGlobalInts: 1,
      numGlobalByteSlices: 1,
      numLocalInts: 1,
      numLocalByteSlices: 1,
    });

    console.log("🧱 Transaction built successfully");

    const signedTxn = txn.signTxn(creator.sk);
    const txId = txn.txID();
    console.log("📤 Sending transaction:", txId);

    await algodClient.sendRawTransaction(signedTxn).do();

    // --- wait for confirmation ---
    console.log("⏳ Waiting for confirmation...");
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // ✅ Safe stringify for BigInts
    console.log(
      "🔍 Full confirmedTxn:",
      JSON.stringify(confirmedTxn, (k, v) =>
        typeof v === "bigint" ? v.toString() : v,
        2
      )
    );

    // ✅ Extract App ID robustly
    let appId =
      confirmedTxn["applicationIndex"] ||
      confirmedTxn["application-index"] ||
      (confirmedTxn?.txn?.txn?.apid
        ? String(confirmedTxn.txn.txn.apid)
        : undefined) ||
      (confirmedTxn?.txn?.txn?.applicationCall?.appIndex
        ? String(confirmedTxn.txn.txn.applicationCall.appIndex)
        : undefined) ||
      (confirmedTxn?.innerTxns &&
        confirmedTxn.innerTxns[0] &&
        (confirmedTxn.innerTxns[0]["applicationIndex"] ||
          confirmedTxn.innerTxns[0]["application-index"])) ||
      undefined;

    if (typeof appId === "bigint") appId = appId.toString();
    if (typeof appId === "number") appId = String(appId);

    if (!appId) {
      try {
        const flat = JSON.stringify(confirmedTxn);
        const m = flat.match(/"applicationIndex"\s*:\s*"?(\\d+)"?/);
        if (m) appId = m[1];
      } catch (_) {}
    }

    if (!appId || appId === "0" || appId === "UNKNOWN") {
      console.error("❌ Could not find Application ID in confirmed transaction.");
    } else {
      console.log("✅ Smart Contract Deployed!");
      console.log("📝 Application ID:", appId);
      console.log(
        `🔗 https://testnet.algoexplorer.io/application/${appId}`
      );
    }

    // ✅ Machine-readable result
    const result = { success: !!appId, appId: appId || null, txId };
    console.log("APPLICATION_RESULT_JSON:" + JSON.stringify(result));

    process.exit(appId ? 0 : 1);
  } catch (err) {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
  }
}

deploy();
