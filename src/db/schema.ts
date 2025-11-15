import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const escrowOrders = sqliteTable('escrow_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  buyer: text('buyer').notNull(),
  seller: text('seller').notNull(),
  amount: integer('amount').notNull(),
  tokenId: integer('token_id'),
  escrowAddress: text('escrow_address').notNull(),
  status: text('status').notNull().default('INIT'),
  txId: text('tx_id'),
  productName: text('product_name').notNull(),
  productDescription: text('product_description').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const blockedUsers = sqliteTable('blocked_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  walletAddress: text('wallet_address').notNull().unique(),
  reason: text('reason').notNull(),
  blockedBy: text('blocked_by').notNull(),
  blockedAt: text('blocked_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});