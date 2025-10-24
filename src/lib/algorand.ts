import algosdk from 'algosdk';

// Algorand client configuration for TestNet
export const algodClient = new algosdk.Algodv2(
  '',
  'https://testnet-api.algonode.cloud',
  ''
);

export const indexerClient = new algosdk.Indexer(
  '',
  'https://testnet-idx.algonode.cloud',
  ''
);

// Helper to wait for transaction confirmation
export async function waitForConfirmation(txId: string, timeout: number = 10) {
  if (txId === null || txId === undefined || txId === '') {
    throw new Error('Invalid transaction ID');
  }

  const startTime = Date.now();
  let lastStatus = await algodClient.status().do();
  let lastRound = lastStatus['last-round'];

  while (Date.now() - startTime < timeout * 1000) {
    const pendingInfo = await algodClient
      .pendingTransactionInformation(txId)
      .do();

    if (
      pendingInfo['confirmed-round'] !== null &&
      pendingInfo['confirmed-round'] > 0
    ) {
      return pendingInfo;
    }

    if (
      pendingInfo['pool-error'] != null &&
      pendingInfo['pool-error'].length > 0
    ) {
      throw new Error(
        `Transaction rejected: ${pendingInfo['pool-error']}`
      );
    }

    lastStatus = await algodClient.status().do();
    lastRound = lastStatus['last-round'];
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Transaction not confirmed after ${timeout} seconds`);
}

// Get account info
export async function getAccountInfo(address: string) {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return accountInfo;
  } catch (error) {
    console.error('Error getting account info:', error);
    throw error;
  }
}

// Convert microAlgos to Algos
export function microAlgosToAlgos(microAlgos: number): number {
  return microAlgos / 1000000;
}

// Convert Algos to microAlgos
export function algosToMicroAlgos(algos: number): number {
  return Math.round(algos * 1000000);
}
