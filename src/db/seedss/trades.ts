import { db } from '@/db';
import { trades } from '@/db/schema';

async function main() {
    const sampleTrades = [
        {
            listingId: 4,
            buyerId: 1,
            sellerId: 3,
            amount: 450,
            escrowAddress: 'ALGO_ESCROW_XYZ123ABC456DEF789GHI012JKL345MNO678PQR901',
            status: 'completed',
            txnId: 'TXN_ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234',
            createdAt: '2024-02-15T16:00:00.000Z',
            updatedAt: '2024-02-15T16:30:00.000Z',
        },
        {
            listingId: 1,
            buyerId: 2,
            sellerId: 1,
            amount: 899,
            escrowAddress: 'ALGO_ESCROW_AAA111BBB222CCC333DDD444EEE555FFF666GGG777',
            status: 'funded',
            txnId: 'TXN_ZZZ999YYY888XXX777WWW666VVV555UUU444TTT333SSS222',
            createdAt: '2024-02-20T10:15:00.000Z',
            updatedAt: '2024-02-20T10:45:00.000Z',
        },
        {
            listingId: 3,
            buyerId: 3,
            sellerId: 2,
            amount: 2500,
            escrowAddress: 'ALGO_ESCROW_NFT987ZYX654WVU321TSR098QOP765NML432KJI109',
            status: 'pending',
            txnId: null,
            createdAt: '2024-02-21T14:20:00.000Z',
            updatedAt: '2024-02-21T14:20:00.000Z',
        },
        {
            listingId: 5,
            buyerId: 1,
            sellerId: 2,
            amount: 350,
            escrowAddress: 'ALGO_ESCROW_SHOE456SNEAK789TRADE012BUY345SELL678HASH901',
            status: 'disputed',
            txnId: 'TXN_DISPUTE111ISSUE222RESOLVE333CHECK444ADMIN555STATUS666',
            createdAt: '2024-02-19T09:30:00.000Z',
            updatedAt: '2024-02-22T11:00:00.000Z',
        },
        {
            listingId: 9,
            buyerId: 3,
            sellerId: 2,
            amount: 1800,
            escrowAddress: 'ALGO_ESCROW_LUX999BAG888FASHION777LUXURY666TRADE555SAFE444',
            status: 'refunded',
            txnId: 'TXN_REFUND777RETURN666CANCEL555BUYER444SELLER333DONE222',
            createdAt: '2024-02-18T15:40:00.000Z',
            updatedAt: '2024-02-20T08:15:00.000Z',
        }
    ];

    await db.insert(trades).values(sampleTrades);
    
    console.log('✅ Trades seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});