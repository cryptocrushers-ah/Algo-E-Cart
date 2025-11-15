import algosdk from "algosdk";
import { indexerClient } from "./client";

/**
 * ✅ Create ASA opt-in transaction
 */
export function createASAOptInTxn(
  accountAddress: string,
  assetId: number,
  suggestedParams: algosdk.SuggestedParams
): algosdk.Transaction {
  // Cast to any to satisfy typing issue with known-good parameters
  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: accountAddress,
    to: accountAddress,
    assetIndex: assetId,
    amount: 0,
    suggestedParams,
  } as any);
}

export function createASATransferTxn(
  sender: string,
  receiver: string,
  assetId: number,
  amount: number,
  suggestedParams: algosdk.SuggestedParams
): algosdk.Transaction {
  return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: sender,
    to: receiver,
    assetIndex: assetId,
    amount,
    suggestedParams,
  }as any);
}

/**
 * ✅ Check if an account has opted into an asset
 */
export async function hasOptedIn(address: string, assetId: number): Promise<boolean> {
  const accountInfo = await indexerClient.lookupAccountByID(address).do();
  const assets = accountInfo.account?.assets || [];
  return assets.some((a: any) => a["asset-id"] === assetId);
}

/**
 * ✅ Get ASA balance
 */
export async function getASABalance(address: string, assetId: number): Promise<number> {
  const accountInfo = await indexerClient.lookupAccountByID(address).do();
  const asset = accountInfo.account?.assets?.find((a: any) => a["asset-id"] === assetId);
  return asset ? Number(asset.amount) : 0;
}
