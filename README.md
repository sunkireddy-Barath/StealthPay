# StealthPay — Private Business Finance OS

> Confidential payroll, invoices, and payments on Solana — powered by Umbra Protocol stealth addresses.

[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://stealth-pay-zpt3.vercel.app)
[![Solana](https://img.shields.io/badge/Chain-Solana%20Devnet-9945FF?logo=solana)](https://solana.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🌟 What is StealthPay?

StealthPay is a full-stack Web3 finance platform that enables businesses to run payroll, create invoices, and send payments on Solana with **complete on-chain privacy**. Amounts and counterparties are encrypted via Umbra Protocol stealth addresses — invisible to public blockchain observers, but provable to auditors via selective viewing key disclosure.

---

## ✨ Key Features

-   🏦 **Private Payroll**: Run salary payments via Umbra stealth addresses. Amounts are encrypted on-chain.
-   📄 **Encrypted Invoices**: Create invoices with auto-generated payment links and track status securely.
-   🔗 **Payment Links**: Generate shareable one-time links for receiving payments anonymously.
-   🔍 **Selective Disclosure**: Reveal transaction details to auditors on-demand using private viewing keys.
-   📊 **Live Dashboard**: Real-time SOL/SPL balances, transaction history, and financial metrics.

---

## 🏗️ System Architecture

```mermaid
graph TD
    User([User / Browser])
    Wallet[Phantom / Solflare Wallet]
    
    subgraph Frontend ["Frontend (React + Vite)"]
        UI[Dashboard / Payroll / Invoices]
        Store[Zustand Global Store]
        UmbraClient[Umbra Service Client]
    end
    
    subgraph Backend ["Backend (Flask Serverless)"]
        API[API Endpoints]
        Auth[JWT Auth]
        ORM[SQLAlchemy ORM]
    end
    
    subgraph Infrastructure ["Infrastructure"]
        DB[(Supabase PostgreSQL)]
        Blockchain[Solana Devnet]
    end
    
    User <--> Wallet
    User <--> UI
    UI <--> Store
    Store <--> UmbraClient
    UI <--> API
    API <--> Auth
    API <--> ORM
    ORM <--> DB
    UmbraClient <--> Blockchain
    API <--> Blockchain
```

---

## 🔄 Application Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend (React)
    participant Backend as Backend (Flask)
    participant DB as Database (Postgres)
    participant Umbra as Umbra Protocol
    participant Chain as Solana Chain

    Note over User,Chain: ── Wallet Connect & Login ──
    User->>Frontend: Connect Wallet
    Frontend->>Backend: POST /api/auth/wallet-login
    Backend->>DB: find_or_create user
    DB-->>Backend: user profile + keys
    Backend-->>Frontend: JWT access_token
    Frontend-->>User: Redirect to Dashboard

    Note over User,Chain: ── Private Payroll ──
    User->>Frontend: Run Payroll
    Frontend->>Umbra: Derive Stealth Address
    Umbra-->>Frontend: stealthAddr + viewingKey
    Frontend->>User: Sign Transaction
    User->>Chain: Broadcast Umbra Tx
    Chain-->>Frontend: tx_hash confirmed
    Frontend->>Backend: POST /api/payroll/run
    Backend->>DB: Store Tx & encrypted metadata
    Backend-->>Frontend: Payroll Complete
```

---

## 📊 Data Flow

```mermaid
flowchart LR
    A[Wallet] -->|Connect| B(Auth Page)
    B -->|JWT| C{Zustand Store}
    C -->|API Request| D[Flask Backend]
    D -->|Query| E[(PostgreSQL)]
    D -->|RPC| F[Solana RPC]
    F -->|Result| D
    E -->|Data| D
    D -->|Response| C
    C -->|State| G[UI Components]
```

---

## 🗄️ Database Schema

```mermaid
erDiagram
    USERS ||--o{ EMPLOYEES : "manages"
    USERS ||--o{ INVOICES : "creates"
    USERS ||--o{ PAYMENT_LINKS : "generates"
    USERS ||--o{ TRANSACTIONS : "owns"
    
    USERS {
        uuid id
        string email
        string wallet_address
        string company_name
        string umbra_spending_key
        string umbra_viewing_key
        timestamp created_at
    }
    
    EMPLOYEES {
        uuid id
        uuid employer_id
        string name
        string email
        string wallet_address
        decimal salary
        string department
        string status
        timestamp last_paid
    }
    
    INVOICES {
        uuid id
        uuid creator_id
        string invoice_number
        string client_name
        decimal amount
        string currency
        string status
        date due_date
        string payment_link
    }
    
    PAYMENT_LINKS {
        uuid id
        uuid creator_id
        string title
        decimal amount
        string currency
        string status
        timestamp expires_at
        string claimed_by
    }
    
    TRANSACTIONS {
        uuid id
        uuid creator_id
        string tx_hash
        string sender
        string receiver
        string encrypted_amount
        string viewing_key
        string type
        string status
        string memo
    }
```

---

## 🛠️ Tech Stack

| Layer          | Technology                                   |
| :------------- | :------------------------------------------- |
| **Frontend**   | React 18, Vite, TypeScript                   |
| **Styling**    | Tailwind CSS, Framer Motion, Radix UI        |
| **State**      | Zustand (Persisted)                          |
| **Wallet**     | @solana/wallet-adapter                       |
| **Backend**    | Python 3.11, Flask 3.0                       |
| **ORM**        | SQLAlchemy + Flask-SQLAlchemy                |
| **Auth**       | Flask-JWT-Extended                           |
| **Database**   | Supabase PostgreSQL (pg8000)                 |
| **Blockchain** | Solana Devnet, Umbra Protocol                |
| **Deployment** | Vercel (Frontend + Serverless Functions)     |

---

## 📂 Project Structure

```text
StealthPay/
├── api/                     # Vercel Python serverless entry point
├── backend/                 # Flask backend logic
│   ├── app/
│   │   ├── api/             # API route handlers
│   │   ├── models/          # SQLAlchemy models
│   │   ├── services/        # Blockchain & wallet logic
│   │   └── utils/           # Utility functions
├── frontend/                # React application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI components
│   │   ├── store/           # Zustand state management
│   │   └── lib/             # API & Umbra service logic
├── vercel.json              # Vercel deployment configuration
└── requirements.txt         # Root dependencies for Vercel
```

---

## 🔌 API Endpoints

| Method | Endpoint                        | Auth | Description                   |
| :----- | :------------------------------ | :--- | :---------------------------- |
| `POST` | `/api/auth/wallet-login`        | No   | Wallet auth → JWT             |
| `GET`  | `/api/payroll/employees`        | Yes  | List employees                |
| `POST` | `/api/payroll/run`              | Yes  | Run payroll (Umbra)           |
| `GET`  | `/api/invoices`                 | Yes  | List invoices                 |
| `POST` | `/api/invoices`                 | Yes  | Create invoice                |
| `POST` | `/api/payment-links/:id/claim`  | No   | Claim a payment link          |
| `POST` | `/api/compliance/decrypt`       | Yes  | Decrypt via viewing key       |
| `GET`  | `/api/health`                   | No   | Health check                  |

---

## ⚙️ Environment Variables

### Backend
| Variable           | Description                                  |
| :----------------- | :------------------------------------------- |
| `DATABASE_URL`     | Supabase PostgreSQL connection string        |
| `JWT_SECRET_KEY`   | Secret for signing JWT tokens                |
| `SOLANA_NETWORK`   | `devnet` or `mainnet-beta`                   |
| `SUPABASE_KEY`     | Supabase service role key                    |

### Frontend
| Variable              | Description                               |
| :-------------------- | :---------------------------------------- |
| `VITE_API_URL`        | Backend base URL                          |
| `VITE_SOLANA_NETWORK` | `devnet` or `mainnet-beta`                |
| `VITE_RPC_URL`        | Solana RPC endpoint                       |

---

## 🚀 Local Development

```bash
# 1. Clone the repository
git clone https://github.com/sunkireddy-Barath/StealthPay.git
cd StealthPay

# 2. Setup Backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Configure your environment
python run.py

# 3. Setup Frontend (New Terminal)
cd frontend
npm install
cp .env.example .env      # Set VITE_API_URL=http://localhost:5000
npm run dev
```

---

## 📦 Deployment (Vercel)

The entire stack deploys to a **single Vercel project**.

1.  Push your code to GitHub.
2.  Connect the repository in the Vercel Dashboard.
3.  Configure Environment Variables.
4.  Vercel will automatically detect the Python `api/` directory and React `frontend/` directory.

```bash
# Optional: Manual deploy
vercel --prod
```

---

## 🔒 Privacy & Compliance

StealthPay uses **Umbra Protocol** to ensure that transaction amounts and recipients are not visible on public explorers. 

-   **Spending Keys**: Used only by the recipient to withdraw funds.
-   **Viewing Keys**: Can be shared with auditors to decrypt specific transaction amounts, ensuring regulatory compliance while maintaining day-to-day privacy.

---

## 📄 License

MIT © 2025 StealthPay
