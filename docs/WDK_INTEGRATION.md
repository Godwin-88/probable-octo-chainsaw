# WDK Integration

This project integrates **Tether's Wallet Development Kit (WDK)** in the gateway layer so that all wallet and transaction flows are non-custodial and consistent across supported chains.

## Where WDK is used

**gateway-wdk** (Node.js/TypeScript) is the only service that talks to WDK. It:

- Uses **read-only** wallet APIs to fetch portfolio (native + ERC-20 balances) without private keys.
- Provides auth via **Sign-In with Wallet** (nonce + signature verification).
- Accepts **signed transactions** from the client and broadcasts them (non-custodial: keys stay in the user’s wallet).

```mermaid
flowchart LR
  subgraph user [User]
    Wallet[Wallet_MetaMask_WDK_etc]
  end
  subgraph gateway [gateway-wdk]
    REST[REST_API]
    WDK_Read[WDK_ReadOnly_Portfolio]
    Auth[Auth_Nonce_Verify]
    Broadcast[Broadcast_Signed_Tx]
  end
  subgraph frontend [Frontend]
    UI[React_UI]
  end
  UI --> REST
  Wallet --> REST
  REST --> WDK_Read
  REST --> Auth
  REST --> Broadcast
  WDK_Read --> Redis[(Redis_Cache)]
```

## Package and modules

- **Portfolio (read-only)**: `@tetherto/wdk-wallet-evm` – `WalletAccountReadOnlyEvm(address, { provider })` for balances.
- **Auth**: Nonce generation and signature verification (e.g. with `ethers.recoverAddress`); no WDK signer required on the server.
- **Execute**: Gateway does not sign; it only broadcasts `signedTxHex` via `eth_sendRawTransaction`. Signing is done in the browser with WDK or MetaMask.

## Architecture: non-custodial flow

```mermaid
sequenceDiagram
  participant U as User
  participant F as Frontend
  participant G as Gateway
  participant W as Wallet_WDK
  participant R as Redis
  participant Chain as Blockchain_RPC

  U->>F: Enter address / Connect wallet
  F->>G: GET /api/portfolio?walletAddress=0x...
  G->>G: Check Redis cache
  alt Cache miss
    G->>W: Read-only balance (WDK)
    W->>Chain: RPC getBalance / getTokenBalance
    Chain-->>W: balances
    W-->>G: balances
    G->>R: Cache portfolio
  end
  G-->>F: positions, totalUsd
  F->>G: POST /api/optimize { walletAddress }
  G-->>F: optimizationId
  F->>G: WebSocket /ws/progress?optimizationId=...
  G->>G: gRPC to AI core (stream)
  G-->>F: progress events
  F->>U: Show plan, request approval
  U->>W: Sign transaction
  W-->>F: signedTxHex
  F->>G: POST /api/execute/signed { signedTxHex }
  G->>Chain: eth_sendRawTransaction
  Chain-->>G: txHash
  G-->>F: txHash
```

- The **frontend** never has private keys; it only triggers optimize and sends the signed payload for execute.
- **All value-moving transactions** are signed in the user’s wallet; the gateway only broadcasts.

## Implementation status

| Feature | Implementation |
|--------|----------------|
| **Portfolio** | `WalletAccountReadOnlyEvm(address, { provider: RPC_URL })` for ETH, USDT, USDC. Results cached in Redis (TTL 120s). |
| **Auth** | `GET /api/auth/nonce?walletAddress=0x...` returns nonce; `POST /api/auth/verify` with `{ walletAddress, signature, message }` verifies via `ethers.recoverAddress` and returns a session token. |
| **Execute** | Plan from AI core cached in Redis. `GET /api/execute/plan/:optimizationId` returns the plan. `POST /api/execute/signed` with `{ signedTxHex }` broadcasts via `eth_sendRawTransaction`. |

## API summary

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/portfolio?walletAddress=0x...&chainId=ethereum | Portfolio (uses WDK read-only + cache). |
| GET | /api/auth/nonce?walletAddress=0x... | Get nonce for Sign-In with Wallet. |
| POST | /api/auth/verify | Body: `walletAddress`, `signature`, `message`. Returns token. |
| POST | /api/optimize | Body: `walletAddress`, `constraints`. Returns `optimizationId`. |
| GET | /ws/progress?optimizationId=... | WebSocket stream of optimization progress. |
| GET | /api/execute/plan/:optimizationId | Cached optimization plan. |
| POST | /api/execute/signed | Body: `signedTxHex`. Broadcasts tx (non-custodial). |
