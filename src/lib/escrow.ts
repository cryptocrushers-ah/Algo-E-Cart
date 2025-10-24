import algosdk from 'algosdk';
import { algodClient, waitForConfirmation, algosToMicroAlgos } from './algorand';

export interface EscrowAccount {
  address: string;
  lsig: algosdk.LogicSigAccount;
}

/**
 * Create an escrow account for a trade
 * This is a simple time-locked escrow that releases funds after a timeout
 * or allows seller to claim after buyer confirmation
 */
export async function createEscrowAccount(
  sellerAddress: string,
  buyerAddress: string,
  amount: number,
  timeoutRounds: number = 1000
): Promise<EscrowAccount> {
  try {
    const params = await algodClient.getTransactionParams().do();
    const closeRemainderTo = sellerAddress;
    const receiver = sellerAddress;
    
    // Create a simple escrow contract
    // In production, use a proper Algorand smart contract
    const tealSource = `#pragma version 8
txn TypeEnum
int pay
==
txn CloseRemainderTo
addr ${closeRemainderTo}
==
&&
txn Receiver
addr ${receiver}
==
&&
txn Amount
int ${algosToMicroAlgos(amount)}
==
&&
txn FirstValid
int ${params.firstRound}
>
&&
txn LastValid
int ${params.firstRound + timeoutRounds}
<
&&`;

    // For demo purposes, create a basic LogicSig
    // In production, compile the TEAL and create proper escrow
    const program = new Uint8Array([1, 32, 1, 1, 34]); // Placeholder
    const lsig = new algosdk.LogicSigAccount(program);
    
    return {
      address: lsig.address(),
      lsig,
    };
  } catch (error) {
    console.error('Error creating escrow:', error);
    throw error;
  }
}

/**
 * Initialize a trade by creating escrow
 */
export async function initTrade(
  sellerAddress: string,
  buyerAddress: string,
  amount: number
): Promise<string> {
  try {
    const escrow = await createEscrowAccount(sellerAddress, buyerAddress, amount);
    return escrow.address;
  } catch (error) {
    console.error('Error initializing trade:', error);
    throw error;
  }
}

/**
 * Fund the escrow (buyer sends payment)
 */
export async function fundTrade(
  buyerAddress: string,
  escrowAddress: string,
  amount: number,
  signCallback: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>
): Promise<string> {
  try {
    const params = await algodClient.getTransactionParams().do();
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: buyerAddress,
      to: escrowAddress,
      amount: algosToMicroAlgos(amount),
      suggestedParams: params,
    });

    const signedTxns = await signCallback([txn]);
    const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
    
    await waitForConfirmation(txId);
    return txId;
  } catch (error) {
    console.error('Error funding trade:', error);
    throw error;
  }
}

/**
 * Confirm delivery and release funds to seller
 */
export async function confirmDelivery(
  buyerAddress: string,
  escrowAddress: string,
  sellerAddress: string,
  amount: number,
  signCallback: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>
): Promise<string> {
  try {
    const params = await algodClient.getTransactionParams().do();
    
    // In production, this would trigger the escrow smart contract
    // For demo, we simulate the release
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: buyerAddress,
      to: sellerAddress,
      amount: algosToMicroAlgos(0.001), // Minimal txn to trigger
      note: new Uint8Array(Buffer.from('DELIVERY_CONFIRMED')),
      suggestedParams: params,
    });

    const signedTxns = await signCallback([txn]);
    const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
    
    await waitForConfirmation(txId);
    return txId;
  } catch (error) {
    console.error('Error confirming delivery:', error);
    throw error;
  }
}

/**
 * Raise a dispute (admin intervention required)
 */
export async function raiseDispute(
  buyerAddress: string,
  tradeId: number,
  reason: string,
  signCallback: (txns: algosdk.Transaction[]) => Promise<Uint8Array[]>
): Promise<string> {
  try {
    const params = await algodClient.getTransactionParams().do();
    
    const disputeNote = JSON.stringify({
      action: 'DISPUTE',
      tradeId,
      reason,
      timestamp: Date.now(),
    });
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: buyerAddress,
      to: buyerAddress, // Self-transaction
      amount: 0,
      note: new Uint8Array(Buffer.from(disputeNote)),
      suggestedParams: params,
    });

    const signedTxns = await signCallback([txn]);
    const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
    
    await waitForConfirmation(txId);
    return txId;
  } catch (error) {
    console.error('Error raising dispute:', error);
    throw error;
  }
}
