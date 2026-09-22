# PolyFit Product Context

## Product Definition

PolyFit is a B2B2C corporate wellness network that connects employers with a network of independent wellness providers, managing employee eligibility, provider access, verified usage, billing, settlement, and employer reporting.

**PolyFit is NOT gym-management software.** We are an aggregation and infrastructure layer.

---

## Business Model

### Value Flow

```
Employer
    ↓ (purchases benefits)
PolyFit
    ↓ (manages network & eligibility)
Wellness Provider Network
    ↓ (provides services)
Employees / Beneficiaries
    ↓ (use services)
PolyFit
    ↓ (tracks utilization & settles)
Employer (billing) + Providers (settlement)
```

### Revenue Model

1. **Platform Fees** - Employers pay PolyFit for platform access
2. **Usage-Based Margin** - Margin on verified visits/utilization
3. **Provider Settlement Fees** - Processing fees from provider settlements
4. **Future Upsells** - Advanced analytics, wellness challenges, etc.

---

## Market Position

### Target Market

**Primary:** East Africa (Rwanda, Kenya, Uganda, Tanzania)
**Initial Focus:** Kigali, Rwanda with controlled pilot in Musanze

**Target Customers:**
- Large corporates (banks, telecoms, government agencies)
- Mid-sized companies with 50+ employees
- Organizations with existing wellness benefits spend

### Competitive Landscape

**Direct Competitors:**
- RibiRewards (corporate rewards platform)
- Benefits Wallet (employee benefits)
- Regional wellness aggregators

**Indirect Competitors:**
- Direct gym-employer contracts
- Corporate wellness consultants
- Traditional health insurance

**Differentiation:**
- Network-based (multiple providers, not single gym)
- Verified usage tracking
- Flexible benefit models
- East Africa-focused
- Corporate wellness specialization

---

## Current Phase

### Phase 1: Market Validation & Core Infrastructure

**Objectives:**
- Validate employer demand
- Onboard initial providers (UB-Fit, Uptown Gym, Golden Gym)
- Build core infrastructure
- Establish commercial terms

**Focus Areas:**
1. Employer acquisition (landing page, demos, onboarding)
2. Provider network (onboarding, contracts, location data)
3. Core infrastructure (eligibility, visits, utilization)
4. Billing & settlement (employer invoicing, provider settlement)
5. Basic reporting (utilization reports, settlement reports)

### Phase 2: Expansion & Enhancement

**Future Scope:**
- Employee mobile app
- Advanced analytics & reporting
- Multi-category expansion (swimming, yoga, mental wellness)
- Provider self-service portal
- Employee wellness challenges
- Integration with HR systems

---

## Core Entities

### Organizations (Employers)

Companies that purchase wellness benefits for employees.

**Key Attributes:**
- Company information
- Contract terms
- Employee roster
- Benefit configuration
- Billing information
- Utilization limits

### Providers

Independent wellness provider businesses.

**Key Attributes:**
- Provider information
- Contract terms
- Pricing models
- Location data
- Service offerings
- Settlement preferences

### Provider Locations

Physical locations of wellness providers.

**Key Attributes:**
- Location details
- Capacity limits
- Operating hours
- Geofence coordinates
- Contact information

### Employees (Beneficiaries)

Corporate employees who receive wellness benefits.

**Key Attributes:**
- Employee information
- Organization association
- Eligibility status
- Benefit configuration
- Utilization tracking

### Benefits

Corporate benefit configurations.

**Key Attributes:**
- Benefit type
- Eligibility rules
- Access rules
- Utilization limits
- Cost structure

### Eligibility

Employee benefit eligibility rules.

**Key Attributes:**
- Employee-benefit association
- Eligibility status
- Effective dates
- Utilization caps
- Access restrictions

### Provider Contracts

Provider agreements and terms.

**Key Attributes:**
- Contract terms
- Pricing models
- Settlement terms
- Service level agreements
- Performance metrics

### Visits

Verified employee visits to providers.

**Key Attributes:**
- Employee-provider association
- Visit verification
- Timestamp
- Location verification
- Status tracking

### Utilization

Usage analytics and tracking.

**Key Attributes:**
- Employee utilization
- Provider utilization
- Organization utilization
- Cost tracking
- Trend analysis

### Invoices

Employer billing.

**Key Attributes:**
- Organization billing
- Usage-based charges
- Platform fees
- Payment terms
- Invoice status

### Settlements

Provider settlement processing.

**Key Attributes:**
- Provider settlement
- Visit-based compensation
- Settlement calculations
- Payment processing
- Settlement status

---

## Key Business Rules

### Eligibility Rules

1. **Organization-Based** - Employees must belong to an organization with active benefits
2. **Benefit-Specific** - Each benefit has specific eligibility criteria
3. **Time-Bound** - Eligibility has effective dates and expiration
4. **Utilization-Capped** - Benefits may have visit or spend limits

### Access Rules

1. **Provider Network** - Employees can access any provider in the network
2. **Location-Based** - Physical presence verification required
3. **Capacity-Limited** - Providers may have capacity limits
4. **Time-Restricted** - Access may be restricted by time of day

### Pricing Models

1. **Per Visit** - Provider paid per verified visit
2. **Per Member/Month** - Fixed monthly rate per enrolled employee
3. **Corporate Package** - Fixed corporate package with utilization caps
4. **Hybrid** - Combination of models

### Settlement Rules

1. **Verified Visits** - Only verified visits trigger settlement
2. **Contract Terms** - Settlement follows provider contract terms
3. **Periodic Settlement** - Regular settlement cycles (monthly, etc.)
4. **Dispute Resolution** - Process for disputed visits

---

## Technical Architecture

### System Architecture

```
Frontend (Next.js)
    ↓ API Calls
Backend (Express.js)
    ↓ Database Operations
Supabase PostgreSQL
    ↓ Data Storage
Tables (organizations, providers, employees, visits, etc.)
```

### Key Design Principles

1. **Multi-Tenancy** - Data isolation by organization
2. **Actor-Based** - All features serve specific actors
3. **Network-Centric** - Provider network is central
4. **Usage-Driven** - Utilization tracking drives billing
5. **Settlement-Focused** - Provider settlement is core

### Technology Stack

**Backend:**
- Node.js + Express.js
- Supabase PostgreSQL
- Supabase Auth
- Row-Level Security (RLS)

**Frontend:**
- Next.js 16 (App Router)
- React 19
- shadcn/ui + Tailwind CSS
- Zustand state management

**Infrastructure:**
- Render hosting
- Supabase cloud
- CDN for static assets

---

## Success Metrics

### Employer Metrics

- Number of employer organizations
- Total enrolled employees
- Employee utilization rates
- Employer satisfaction scores
- Contract renewal rates

### Provider Metrics

- Number of providers in network
- Provider location count
- Verified visit volume
- Provider satisfaction scores
- Settlement accuracy and timeliness

### Platform Metrics

- Total verified visits
- Utilization trends
- Billing accuracy
- Settlement processing time
- Platform uptime and reliability

---

## Risks & Mitigations

### Market Risks

**Risk:** Low employer demand for corporate wellness
**Mitigation:** Validate demand before heavy investment, start with pilot

**Risk:** Provider resistance to network model
**Mitigation:** Flexible contract terms, guaranteed minimums, clear value proposition

### Operational Risks

**Risk:** Visit verification challenges
**Mitigation:** Multiple verification methods, geofencing, provider confirmation

**Risk:** Settlement disputes
**Mitigation:** Clear contract terms, dispute resolution process, audit trails

### Technical Risks

**Risk:** Platform scalability
**Mitigation:** Cloud infrastructure, database optimization, load testing

**Risk:** Data security and privacy
**Mitigation:** Row-Level Security, encryption, compliance with data protection laws

---

## Future Vision

### Long-Term Vision

PolyFit aims to become the leading corporate wellness infrastructure platform in East Africa, expanding to multiple wellness categories and serving thousands of employers and millions of employees.

### Expansion Path

1. **Geographic:** Rwanda → Kenya → Uganda → Tanzania → East Africa
2. **Category:** Fitness → Swimming → Yoga → Mental Wellness → Nutrition → Full wellness
3. **Product:** Core platform → Mobile apps → Advanced analytics → Wellness challenges → Integration ecosystem

### Exit Strategy

Potential exit paths:
- Acquisition by larger wellness platform
- Acquisition by benefits provider
- Regional expansion to pan-African platform
- IPO as regional wellness infrastructure leader