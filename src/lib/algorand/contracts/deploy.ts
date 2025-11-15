/**
 * Deploy Algorand Smart Contract
 * Handles contract deployment and configuration
 */

import algosdk, { Algodv2, Account } from 'algosdk';
import { readFileSync } from 'fs';
import { join } from 'path';

// ----------------------------------
// 🔧 Configuration
// ----------------------------------
export const ESCROW_CONTRACT_CONFIG = {
  numGlobalByteSlices: 4, // buyer, seller, admin, listing_id
  numGlobalInts: 3,       // amount, status, created_at
  numLocalByteSlices: 0,
  numLocalInts: 0,
};

// Default TestNet client (used if not provided)
const DEFAULT_ALGOD = new algosdk.Algodv2(
  '',
  'https://testnet-api.algonode.cloud',
  ''
);

// ----------------------------------
// 📄 TEAL Loader
// ----------------------------------
export function loadTealPrograms() {
  try {
    const contractsPath = join(process.cwd(), 'src/lib/algorand/contracts/teal');

    const approvalProgram = readFileSync(
      join(contractsPath, 'escrow_approval.teal'),
      'utf8'
    );

    const clearProgram = readFileSync(
      join(contractsPath, 'escrow_clear.teal'),
      'utf8'
    );

    return { approvalProgram, clearProgram };
  } catch (err) {
    throw new Error(`❌ Failed to load TEAL programs: ${err}`);
  }
}

// ----------------------------------
// 🧩 TEAL Compilation
// ----------------------------------
export async function compileTeal(
  algodClient: Algodv2,
  tealSource: string
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const programBytes = encoder.encode(tealSource);
  const compileResponse = await algodClient.compile(programBytes).do();

  // `compileResponse.result` is Base64 encoded bytecode
  const compiled = Buffer.from(compileResponse.result, 'base64');
  return new Uint8Array(compiled);
}

// ----------------------------------
// 🚀 Deploy Escrow Smart Contract
// ----------------------------------
export async function deployEscrowContract(
  algodClient: Algodv2 = DEFAULT_ALGOD,
  creatorAccount?: Account
): Promise<number> {
  try {
    if (!creatorAccount) {
      throw new Error(
        'Missing creator account. Please pass an Algorand account (mnemonic-derived).'
      );
    }

    console.log('📦 Starting smart contract deployment...');
    const { approvalProgram, clearProgram } = loadTealPrograms();

    // Compile TEAL
    const approvalCompiled = await compileTeal(algodClient, approvalProgram);
    const clearCompiled = await compileTeal(algodClient, clearProgram);

    // Suggested params
    const params = await algodClient.getTransactionParams().do();

    // Create Application Create Transaction
    const txn = algosdk.makeApplicationCreateTxnFromObject({
      from: creatorAccount.addr as unknown as string, // type-safe cast
      suggestedParams: params,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram: approvalCompiled,
      clearProgram: clearCompiled,
      numLocalInts: ESCROW_CONTRACT_CONFIG.numLocalInts,
      numLocalByteSlices: ESCROW_CONTRACT_CONFIG.numLocalByteSlices,
      numGlobalInts: ESCROW_CONTRACT_CONFIG.numGlobalInts,
      numGlobalByteSlices: ESCROW_CONTRACT_CONFIG.numGlobalByteSlices,
    } as any); // bypass TS definition mismatch

    // Sign and submit
    const signedTxn = txn.signTxn(creatorAccount.sk);
    const txId = txn.txID().toString();
    await algodClient.sendRawTransaction(signedTxn).do();

    console.log('⏳ Waiting for transaction confirmation...');
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    const appIdNumber = confirmedTxn.applicationIndex;
    if (typeof appIdNumber !== 'number' || isNaN(appIdNumber)) {
      throw new Error('Application ID not found in transaction confirmation.');
    }

    const appId = appIdNumber;
    console.log('✅ Smart contract deployed successfully!');
    console.log(`🆔 Application ID: ${appId}`);
    console.log(`🔗 Transaction ID: ${txId}`);

    return appId;
  } catch (error: any) {
    console.error('❌ Deployment failed:', error.message || error);
    throw error;
  }
}

// ----------------------------------
// 💰 Fund Contract Account
// ----------------------------------
export async function fundContractAccount(
  algodClient: Algodv2 = DEFAULT_ALGOD,
  appId: number,
  funderAccount: Account,
  amount: number = 100_000 // 0.1 ALGO
): Promise<string> {
  try {
    const appAddress = algosdk.getApplicationAddress(appId);
    const params = await algodClient.getTransactionParams().do();

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: funderAccount.addr as unknown as string,
      to: appAddress.toString(),
      amount: amount,
      suggestedParams: params,
    } as any);

    const signedTxn = txn.signTxn(funderAccount.sk);
    const txId = txn.txID().toString();
    await algodClient.sendRawTransaction(signedTxn).do();

    await algosdk.waitForConfirmation(algodClient, txId, 4);

    console.log(`✅ Contract funded with ${(amount / 1_000_000).toFixed(6)} ALGO`);
    console.log(`🔗 Transaction ID: ${txId}`);

    return txId;
  } catch (error: any) {
    console.error('❌ Funding failed:', error.message || error);
    throw error;
  }
}

// ----------------------------------
// 📬 Utility: Get Contract Address
// ----------------------------------
export function getContractAddress(appId: number): string {
  return algosdk.getApplicationAddress(appId).toString();
}

// ----------------------------------
// 🧠 Node execution (Backend Bridge Mode)
// ----------------------------------
if (require.main === module) {
  (async () => {
    try {
      const mnemonic = process.env.CREATOR_MNEMONIC;
      if (!mnemonic) {
        throw new Error('Missing CREATOR_MNEMONIC in environment variables.');
      }

      const creatorAccount = algosdk.mnemonicToSecretKey(mnemonic);
      const app_id = await deployEscrowContract(DEFAULT_ALGOD, creatorAccount);

      console.log(JSON.stringify({ success: true, app_id }));
    } catch (err: any) {
      console.error(JSON.stringify({ success: false, error: err.message }));
      process.exit(1);
    }
  })();
}
