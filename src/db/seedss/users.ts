import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
            username: 'AlgoTrader1',
            bio: 'Crypto enthusiast and marketplace veteran. Trading since 2020.',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AlgoTrader1',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
        },
        {
            walletAddress: '0x5678901234567890abcdef5678901234567890ab',
            username: 'NFTCollector',
            bio: 'Art collector and NFT enthusiast. Love rare digital collectibles.',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NFTCollector',
            createdAt: '2024-01-20T14:20:00.000Z',
            updatedAt: '2024-01-20T14:20:00.000Z',
        },
        {
            walletAddress: '0x9abcdef123456789012345678901234567890abc',
            username: 'TechGuru99',
            bio: 'Tech enthusiast selling quality electronics and gadgets.',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechGuru99',
            createdAt: '2024-02-01T09:15:00.000Z',
            updatedAt: '2024-02-01T09:15:00.000Z',
        },
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});