# AGL Studio v6

## Overview

Production-ready Web3 token dashboard for the **AGL (Agunnaya Labs)** token deployed on **Base mainnet**.  
Live blockchain data is fetched directly from `https://mainnet.base.org` (public Base RPC) — no mocks, no stubs.

## AGL Token

- **Contract**: `0xEA1221B4d80A89BD8C75248Fae7c176BD1854698`
- **Chain**: Base Mainnet (chainId: 8453)
- **Symbol**: AGL / Name: Agunnaya Labs
- **Total Supply**: 1,000,000,000 AGL (fixed, no mint)
- **Explorer**: https://basescan.org/token/0xEA1221B4d80A89BD8C75248Fae7c176BD1854698

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite + Tailwind CSS + Framer Motion
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (caches on-chain events)
- **Blockchain**: viem (Base mainnet, public RPC)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Charts**: Recharts
- **Routing**: Wouter

## App Features

- `/` Dashboard — live token stats (total supply, circulating, burned, burn %)
- `/analytics` — burn history chart, 24h metrics, biggest burn
- `/burn` — burn portal with recent burn events list
- `/transfers` — all recent transfer events with filtering by address
- `/wallet` — wallet balance lookup for any Base address
- `/about` — tokenomics, contract info, Basescan links

## Architecture

- **Frontend** (`artifacts/agl-studio`): React + Vite SPA, serves at `/`
- **API Server** (`artifacts/api-server`): Express 5 on `/api`, proxies Base blockchain
- **DB Schema** (`lib/db/src/schema/transfers.ts`): Caches `agl_transfers`, `agl_cache_meta`, `agl_burn_history`
- **Blockchain lib** (`artifacts/api-server/src/lib/blockchain.ts`): viem client for Base
- **Sync service** (`artifacts/api-server/src/lib/syncTransfers.ts`): Background ingestion of Transfer events

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/agl-studio run dev` — run frontend locally

## Secrets Used

- `SESSION_SECRET` — session signing
- `DATABASE_URL` — PostgreSQL connection (auto-provisioned)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — DB connection parts
