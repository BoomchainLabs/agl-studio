# AGL Studio v6

<div align="center">

![AGL Studio](https://img.shields.io/badge/AGL%20STUDIO-v6-00ffff?style=for-the-badge&labelColor=0a0a0a&color=00ffff)
[![License: MIT](https://img.shields.io/badge/License-MIT-00ffff?style=flat-square&labelColor=0a0a0a)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js&logoColor=white&labelColor=0a0a0a)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white&labelColor=0a0a0a)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white&labelColor=0a0a0a)](https://react.dev)
[![Base Chain](https://img.shields.io/badge/Chain-Base%20Mainnet-0052FF?style=flat-square&logo=coinbase&logoColor=white&labelColor=0a0a0a)](https://base.org)
[![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?style=flat-square&logo=pnpm&logoColor=white&labelColor=0a0a0a)](https://pnpm.io)

**Production-ready Web3 token dashboard for the AGL (Agunnaya Labs) token on Base mainnet.**  
Live blockchain data. No mocks. No stubs. Terminal aesthetic.

[Live Demo](#) · [Token on Basescan](https://basescan.org/token/0xEA1221B4d80A89BD8C75248Fae7c176BD1854698) · [Report Bug](#) · [Request Feature](#)

</div>

-----

## Table of Contents

- [Overview](#overview)
- [Token Details](#token-details)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Key Commands](#key-commands)
- [Pages & Routes](#pages--routes)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Suggested Feature Additions](#suggested-feature-additions)
- [Contributing](#contributing)
- [License](#license)

-----

## Overview

AGL Studio is a full-stack monorepo dashboard for the **AGL token** on Base mainnet. It streams real blockchain data via `viem`, caches Transfer events in PostgreSQL, serves a typed REST API via Express 5, and renders everything in a dark, monospace terminal-style React SPA.

It is structured as a **pnpm workspace monorepo** with a clear separation of concerns: the frontend, the API server, the DB schema, the OpenAPI spec, and the auto-generated client hooks are all independent packages — but share types end-to-end via Zod and Orval codegen.

-----

## Token Details

|Field            |Value                                                                                                                |
|-----------------|---------------------------------------------------------------------------------------------------------------------|
|**Contract**     |[`0xEA1221B4d80A89BD8C75248Fae7c176BD1854698`](https://basescan.org/token/0xEA1221B4d80A89BD8C75248Fae7c176BD1854698)|
|**Chain**        |Base Mainnet (chainId: `8453`)                                                                                       |
|**Symbol / Name**|`AGL` / Agunnaya Labs                                                                                                |
|**Total Supply** |1,000,000,000 AGL (fixed — no mint function)                                                                         |
|**Decimals**     |18                                                                                                                   |
|**Deflationary** |Yes — burns tracked to `0x0000...0000`                                                                               |
|**RPC**          |`https://mainnet.base.org` (public)                                                                                  |
|**Explorer**     |https://basescan.org                                                                                                 |

-----

## Features

### Dashboard (`/`)

- Live token stats: total supply, circulating supply, total burned, burn percentage
- Real-time “last updated” timestamp
- Recent transfers feed (tx hash, from → to, amount)
- Recent burns feed with Basescan deep-links
- Animated stagger-in with Framer Motion

### Indexer (`/indexer`)

- On-chain event indexer status panel
- Displays last synced block, sync progress, and batch state
- Manual trigger support

### AI Analyst (`/ai`)

- Persistent AI conversation threads backed by PostgreSQL
- Streaming responses via SSE
- Auto-generated insights panel (burn velocity, supply projections)
- Conversation list with create/delete
- Scrollable chat with optimistic UI updates

### Analytics (`/analytics`)

- 24h transfer volume and count
- 24h burn volume and largest-ever burn
- Area chart: burn history over time (90-day window)
- Bar chart: daily transaction count
- Recharts with custom dark theme

### Staking (`/staking`)

- Global staking stats: total staked, active stakers, estimated APY, total rewards
- Tabbed view: recent positions vs. leaderboard (top 10)
- Per-address position lookup
- “Coming Soon” gate when staking contract is not yet deployed

### DAO Governance (`/dao`, `/dao/:id`)

- Proposal list with status filtering (active / passed / failed / all)
- Per-proposal detail view
- Create proposal dialog (title, category, description, duration)
- Vote counts (for / against) displayed inline
- Status badges with animated pulse for active proposals

### Liquidity (`/liquidity`)

- Liquidity wallet balance view
- Pool list with live data
- Create-pools action with configurable `aglPerEth` and `aglAmountPerPool`
- Refresh controls

### Burn Portal (`/burn`)

- Hero section with animated burn glow
- Total burned + burn rate prominently displayed
- Paginated recent burn events (up to 50)
- Basescan links on every transaction
- Explanation of the deflationary mechanism

### Transfers (`/transfers`)

- Full transfer event feed with address filtering
- Pagination via limit query param
- Renders burn vs. transfer events differently

### Wallet Lookup (`/wallet`)

- Paste any Base address to check AGL balance
- Validates address format client-side before fetching
- Displays formatted balance with symbol

### Tokenomics (`/about`)

- Contract info, chain details, supply breakdown
- Basescan and RPC links
- Static tokenomics prose

-----

## Tech Stack

|Layer            |Technology                                       |
|-----------------|-------------------------------------------------|
|**Monorepo**     |pnpm workspaces                                  |
|**Language**     |TypeScript 5.9                                   |
|**Runtime**      |Node.js 24                                       |
|**Frontend**     |React 19, Vite, Tailwind CSS, Framer Motion      |
|**Routing**      |Wouter                                           |
|**Data Fetching**|TanStack Query v5                                |
|**UI Components**|shadcn/ui (Radix primitives)                     |
|**Charts**       |Recharts                                         |
|**API Server**   |Express 5                                        |
|**Database**     |PostgreSQL + Drizzle ORM                         |
|**Blockchain**   |viem (Base mainnet, public RPC)                  |
|**Validation**   |Zod v4, drizzle-zod                              |
|**API Codegen**  |Orval (OpenAPI → React Query hooks + Zod schemas)|
|**Logging**      |pino                                             |

-----

## Architecture

```
agl-studio-main/
│
├── artifacts/
│   ├── agl-studio/               # React 19 SPA (Vite)
│   │   └── src/
│   │       ├── pages/            # Route-level components
│   │       ├── components/ui/    # shadcn/ui component library
│   │       └── lib/              # utils, api client wrappers
│   │
│   └── api-server/               # Express 5 REST API
│       └── src/
│           ├── routes/           # token, staking, dao, ai, liquidity, indexer, health
│           ├── lib/
│           │   ├── blockchain.ts # viem client + AGL helpers
│           │   └── syncTransfers.ts # background event ingestion
│           └── middlewares/
│
├── lib/
│   ├── db/                       # Drizzle ORM schema + client
│   │   └── src/schema/           # transfers, staking, dao, aiConversations, messages
│   ├── api-zod/                  # Auto-generated Zod types from OpenAPI spec
│   ├── api-client-react/         # Auto-generated React Query hooks (via Orval)
│   └── integrations-openai-*/    # OpenAI audio/image/batch client + server libs
│
└── scripts/                      # Post-merge hooks, utilities
```

### Data Flow

```
Base Mainnet (RPC)
       │
       ▼
  syncTransfers.ts  ──► PostgreSQL (agl_transfers, agl_burn_history, agl_cache_meta)
       │
       ▼
  Express 5 API  (/api/token, /api/burns, /api/analytics, ...)
       │
       ▼
  Orval-generated React Query Hooks
       │
       ▼
  React SPA (Vite)  →  User
```

The sync service batches Base chain Transfer events in chunks of 2,000 blocks, starting from block `22,000,000`. It is triggered lazily on API calls (non-blocking) and tracks progress via a `agl_cache_meta` key-value table.

-----

## Getting Started

### Prerequisites

- [Node.js 24+](https://nodejs.org)
- [pnpm 9+](https://pnpm.io/installation)
- A PostgreSQL 15+ database

```bash
# Install pnpm globally if needed
npm install -g pnpm
```

### Installation

```bash
# Clone the repo
git clone https://github.com/github.com/BoomchainLabs/agl-studio.git
cd agl-studio

# Install all workspace dependencies
pnpm install
```

### Database Setup

```bash
# Push schema to your database
pnpm --filter @workspace/db run push
```

### Running Locally

```bash
# Terminal 1 — API server (Express 5, default port 3001)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (Vite, default port 5173)
pnpm --filter @workspace/agl-studio run dev
```

The frontend proxies `/api` requests to the API server. Open `http://localhost:5173`.

-----

## Environment Variables

Create a `.env` file in the root or set these in your deployment environment:

|Variable        |Required|Description                             |
|----------------|--------|----------------------------------------|
|`DATABASE_URL`  |✅       |Full PostgreSQL connection string       |
|`PGHOST`        |✅       |PostgreSQL host                         |
|`PGPORT`        |✅       |PostgreSQL port (default: `5432`)       |
|`PGUSER`        |✅       |PostgreSQL user                         |
|`PGPASSWORD`    |✅       |PostgreSQL password                     |
|`PGDATABASE`    |✅       |Database name                           |
|`SESSION_SECRET`|✅       |Secret for signing sessions             |
|`OPENAI_API_KEY`|⚠️       |Required only for the AI Analyst feature|


> **Note:** The blockchain RPC is the public Base endpoint (`https://mainnet.base.org`) and requires no API key. For production, consider a private RPC via Alchemy or Infura for higher rate limits.

-----

## Key Commands

```bash
# Full typecheck across all packages
pnpm run typecheck

# Build all packages (typecheck + build)
pnpm run build

# Regenerate API hooks and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only — use migrations in prod)
pnpm --filter @workspace/db run push

# Run API server in dev mode
pnpm --filter @workspace/api-server run dev

# Run frontend in dev mode
pnpm --filter @workspace/agl-studio run dev
```

-----

## Pages & Routes

|Route       |Component        |Description                               |
|------------|-----------------|------------------------------------------|
|`/`         |`Dashboard`      |Live token stats, recent transfers + burns|
|`/analytics`|`Analytics`      |Burn history charts, 24h metrics          |
|`/burn`     |`Burn`           |Burn portal hero + event log              |
|`/transfers`|`Transfers`      |Full transfer feed with address filter    |
|`/wallet`   |`Wallet`         |Wallet balance lookup                     |
|`/indexer`  |`Indexer`        |Sync status + block progress              |
|`/ai`       |`AiAnalyst`      |AI chat with token context                |
|`/staking`  |`Staking`        |Staking stats, positions, leaderboard     |
|`/dao`      |`DaoGovernance`  |Proposal list + create proposal           |
|`/dao/:id`  |`DaoProposalView`|Proposal detail + voting                  |
|`/liquidity`|`Liquidity`      |Pool management + wallet balance          |
|`/about`    |`About`          |Tokenomics + contract info                |

-----

## API Reference

All endpoints are served at `/api`. The full OpenAPI spec is in `lib/api-spec/`.

### Token

|Method|Path                         |Description                                           |
|------|-----------------------------|------------------------------------------------------|
|`GET` |`/api/token/info`            |Token metadata (name, symbol, decimals, supply, chain)|
|`GET` |`/api/token/stats`           |Live stats: supply, burned, circulating, burn %       |
|`GET` |`/api/token/balance/:address`|AGL balance for a Base address                        |

### Transfers & Burns

|Method|Path            |Description                        |
|------|----------------|-----------------------------------|
|`GET` |`/api/transfers`|List transfers (`?limit=&address=`)|
|`GET` |`/api/burns`    |List burn events (`?limit=`)       |

### Analytics

|Method|Path                         |Description                      |
|------|-----------------------------|---------------------------------|
|`GET` |`/api/analytics/overview`    |24h volumes, burn %, largest burn|
|`GET` |`/api/analytics/burn-history`|90-day daily burn history        |

### Staking

|Method|Path                            |Description                    |
|------|--------------------------------|-------------------------------|
|`GET` |`/api/staking/stats`            |Global staking stats           |
|`GET` |`/api/staking/positions`        |Recent staking positions       |
|`GET` |`/api/staking/leaderboard`      |Top stakers                    |
|`GET` |`/api/staking/position/:address`|Position for a specific address|

### DAO

|Method|Path                         |Description                  |
|------|-----------------------------|-----------------------------|
|`GET` |`/api/dao/stats`             |DAO stats (proposals, quorum)|
|`GET` |`/api/dao/proposals`         |List proposals (`?status=`)  |
|`POST`|`/api/dao/proposals`         |Create a governance proposal |
|`GET` |`/api/dao/proposals/:id`     |Get proposal detail          |
|`POST`|`/api/dao/proposals/:id/vote`|Cast a vote                  |

### AI

|Method  |Path                               |Description                   |
|--------|-----------------------------------|------------------------------|
|`GET`   |`/api/ai/insights`                 |Auto-generated token insights |
|`GET`   |`/api/ai/conversations`            |List AI conversations         |
|`POST`  |`/api/ai/conversations`            |Create new conversation       |
|`GET`   |`/api/ai/conversations/:id`        |Get conversation + messages   |
|`DELETE`|`/api/ai/conversations/:id`        |Delete a conversation         |
|`POST`  |`/api/ai/conversations/:id/message`|Send a message (streaming SSE)|

### Liquidity

|Method|Path                         |Description               |
|------|-----------------------------|--------------------------|
|`GET` |`/api/liquidity/wallet`      |Liquidity wallet balances |
|`GET` |`/api/liquidity/pools`       |Active liquidity pools    |
|`POST`|`/api/liquidity/create-pools`|Initialize liquidity pools|

### Indexer

|Method|Path                 |Description                   |
|------|---------------------|------------------------------|
|`GET` |`/api/indexer/status`|Sync progress, last block, lag|

### Health

|Method|Path         |Description                             |
|------|-------------|----------------------------------------|
|`GET` |`/api/health`|Server health check (`{ status: "ok" }`)|

-----

## Database Schema

All tables are prefixed with `agl_` to namespace cleanly.

### `agl_transfers`

Caches all Transfer events emitted by the AGL contract.

|Column            |Type         |Notes                        |
|------------------|-------------|-----------------------------|
|`tx_hash`         |`text` PK    |Transaction hash             |
|`block_number`    |`bigint`     |Block number                 |
|`from_address`    |`text`       |Sender                       |
|`to_address`      |`text`       |Receiver                     |
|`amount`          |`text`       |Raw wei amount               |
|`amount_formatted`|`text`       |Human-readable AGL           |
|`is_burn`         |`boolean`    |`true` if `to` is `0x0000...`|
|`timestamp`       |`timestamptz`|Block timestamp              |
|`created_at`      |`timestamptz`|Insert time                  |

### `agl_cache_meta`

Key-value store for sync state (e.g., `last_synced_block`).

### `agl_burn_history`

Aggregated daily burn data used by the Analytics charts.

|Column            |Type     |Notes                      |
|------------------|---------|---------------------------|
|`date`            |`text` PK|ISO date string            |
|`burned`          |`text`   |Total burned that day (wei)|
|`burned_formatted`|`text`   |Human-readable             |
|`tx_count`        |`integer`|Number of burn txs         |

### `agl_staking_positions`

Tracks staking positions (populated once staking contract is deployed).

### `agl_dao_proposals` + `agl_dao_votes`

DAO governance proposal and vote records.

### `agl_ai_conversations` + `agl_ai_messages`

Persistent AI chat history per conversation thread.

-----

## Suggested Feature Additions

The following features are well-suited to the existing architecture and would meaningfully extend the dashboard:

### 1. Price Feed Integration

Integrate a DEX price oracle (e.g., Uniswap V3 pool TWAP or Aerodrome on Base) to display live AGL/ETH and AGL/USD prices on the Dashboard and Analytics pages. The API server already uses `viem` and could call `slot0()` on the relevant pool contract.

### 2. Holder Distribution Chart

Fetch the top N holder addresses from an indexer or The Graph subgraph and render a pie/treemap chart on the Analytics page showing token distribution across wallets — helps communicate decentralization at a glance.

### 3. WebSocket Live Feed

Replace the polling-based transfer feed with a WebSocket subscription using `viem`’s `watchEvent` on the server, pushing new Transfer events to connected clients in real time. The frontend could display a live ticker instead of a static list.

### 4. ENS / Basename Resolution

Resolve wallet addresses to ENS names or Base’s native Basenames (`.base.eth`) before displaying them throughout the UI. This makes the Transfers, Staking, and DAO pages far more readable — currently all addresses show as truncated hex.

### 5. Export to CSV

Add a download button on the Transfers and Burns pages to export the current filtered dataset as a CSV file. Useful for token holders doing tax reporting or on-chain analysis.

### 6. Notification Alerts

Allow users to subscribe (via email or browser push) to alerts for large burns (over a configurable threshold) or new DAO proposals becoming active. The API server could use a simple queue + cron job pattern.

### 7. Multi-Wallet Portfolio View

Extend the Wallet Lookup page to accept multiple addresses and aggregate their total AGL holdings, staking positions, and DAO voting history into a unified portfolio summary view.

### 8. Staking Contract Integration

Once the staking contract is audited and deployed, wire up the actual on-chain `stake()`, `unstake()`, and `claimRewards()` calls using `wagmi` + `viem` wallet client. The UI scaffolding (position lookup, leaderboard, APY display) is already in place.

-----

## Contributing

1. Fork the repository
1. Create your feature branch: `git checkout -b feat/my-feature`
1. Commit your changes: `git commit -m 'feat: add my feature'`
1. Push to the branch: `git push origin feat/my-feature`
1. Open a Pull Request

Please ensure `pnpm run typecheck` passes before submitting. Follow the existing monorepo structure — new features belong either in an existing artifact or as a new `lib/` package.

-----

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

-----

<div align="center">

Built by [Agunnaya Labs](https://github.com/agunnaya001) · Deployed on [Base](https://base.org)

[![Base](https://img.shields.io/badge/Base-Mainnet-0052FF?style=flat-square&logo=coinbase&logoColor=white&labelColor=0a0a0a)](https://base.org)
[![Basescan](https://img.shields.io/badge/Basescan-Token-00ffff?style=flat-square&labelColor=0a0a0a)](https://basescan.org/token/0xEA1221B4d80A89BD8C75248Fae7c176BD1854698)
[![Viem](https://img.shields.io/badge/viem-blockchain-AB9FF2?style=flat-square&labelColor=0a0a0a)](https://viem.sh)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat-square&labelColor=0a0a0a)](https://orm.drizzle.team)

</div>
