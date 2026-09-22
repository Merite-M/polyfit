# PolyFit — Corporate Wellness Network

> B2B2C corporate wellness infrastructure connecting employers with a network of independent wellness providers.

---

## Overview

PolyFit is a corporate wellness network that connects employers with a network of independent wellness providers (gyms, swimming pools, yoga studios, mental wellness services, etc.). The platform manages employee eligibility, provider access, verified visits, utilization tracking, billing, provider settlement, and employer reporting.

**This is NOT gym-management software.** PolyFit is an aggregation and infrastructure layer — we do not operate or manage the wellness providers themselves.

---

## Business Model

```
Employer
    ↓
PolyFit
    ↓
Wellness Provider Network
    ↓
Employees / Beneficiaries
```

1. **Employers** purchase corporate wellness benefits for their employees
2. **PolyFit** manages eligibility, access rules, and provider contracts
3. **Wellness Providers** offer their services to eligible employees
4. **Employees** access providers using verified visit passes
5. **PolyFit** tracks utilization, handles billing, and settles with providers

---

## Architecture

### Monorepo Structure

```
polyfit/
├── apps/
│   ├── backend-core/        # Express.js API server
│   └── web-gym-saas/        # Next.js landing page and applications
├── packages/
│   ├── shared-utils/        # Shared utility functions
│   ├── supabase-client/     # Supabase client configuration
│   └── ui-theme/           # Design tokens and Tailwind config
├── DESIGN_SYSTEM.md         # Brand guidelines and design tokens
├── DESIGN.md                # Design system configuration
└── AGENTS.md                # AI agent rules and product context
```

### Tech Stack

**Backend**
- Runtime: Node.js (CommonJS)
- Framework: Express 5
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth

**Frontend**
- Framework: Next.js 16 (App Router, Static Export)
- UI: shadcn/ui + Tailwind CSS v4
- State: Zustand
- Icons: Lucide React

**Infrastructure**
- Hosting: Render
- Database: Supabase
- Storage: Supabase Storage

---

## Core Concepts

### Actors

1. **Employer/Organization** - Companies that purchase wellness benefits for employees
2. **Employee/Beneficiary** - Employees who receive wellness benefits
3. **Wellness Provider** - Independent facilities (gyms, pools, studios, etc.)
4. **Provider Location** - Physical locations of wellness providers
5. **PolyFit Operations** - Internal platform management

### Key Entities

- **Organizations** - Employer accounts and contracts
- **Providers** - Wellness provider businesses
- **Provider Locations** - Physical provider facilities
- **Employees** - Employee beneficiary records
- **Benefits** - Corporate benefit configurations
- **Eligibility** - Employee benefit eligibility rules
- **Provider Contracts** - Provider agreements and terms
- **Visits** - Verified employee visits to providers
- **Utilization** - Usage analytics and tracking
- **Invoices** - Employer billing
- **Settlements** - Provider settlement processing

---

## Getting Started

### Prerequisites

- Node.js v20+
- pnpm package manager
- A Supabase project

### Installation

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev
```

### Environment Variables

**Backend (apps/backend-core/.env)**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:3000
PORT=3001
JWT_SECRET=your_jwt_secret
INTERNAL_API_KEY=your_internal_api_key
```

**Frontend (apps/web-gym-saas/.env.local)**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Development

### Backend Development

```bash
cd apps/backend-core
node index.js
```

The backend API server runs on port 3001 by default.

### Frontend Development

```bash
cd apps/web-gym-saas
pnpm dev
```

The development server runs on http://localhost:3000.

### Build

```bash
# Build all packages
pnpm build

# Build specific app
pnpm --filter @polyfit/web-gym-saas build
```

---

## Anti-Bias Rules for AI Agents

**CRITICAL**: PolyFit is a corporate wellness aggregator, NOT gym-management software.

Before implementing any feature, determine which actor it serves:
1. Employer
2. Employee/Beneficiary
3. Wellness Provider
4. PolyFit Operations
5. Finance/Settlement

**Do NOT introduce:**
- Gym member management
- Gym POS systems
- Gym staff management
- Single-gym administration
- Gym-owner SaaS workflows
- Gym-specific operational features

**Prefer terminology:**
- provider (not gym)
- beneficiary/employee (not member)
- benefit (not membership)
- visit (not attendance)
- settlement (not gym payment)

See `AGENTS.md` for comprehensive product context and development rules.

---

## License

Private - All rights reserved