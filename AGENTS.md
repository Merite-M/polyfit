# PolyFit Agent Rules

## Product Context

**PolyFit is a B2B2C corporate wellness network.**

**PolyFit is NOT gym-management software.**

The platform connects employers with a network of independent wellness providers and manages:
- Corporate wellness benefits
- Employee eligibility
- Provider access
- Verified visits
- Utilization tracking
- Provider contracts and pricing
- Billing
- Provider settlement
- Employer reporting

A gym is a type of wellness provider, not the center of the system. PolyFit does not operate or manage the gyms themselves.

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

### Current Phase

Initial focus:
- Corporate fitness
- Gyms as providers
- Employer-funded wellness benefits
- Provider network
- Verified visits
- Employer reporting
- Provider settlement

### Future Categories

May expand to include:
- Swimming
- Yoga
- Mental wellness
- Physiotherapy
- Nutrition
- Other wellness services

---

## Anti-Bias Rules

### Before Implementing Any Feature

Determine which PolyFit actor it serves:

1. **Employer** - HR/Procurement/Finance at client companies
2. **Employee/Beneficiary** - Corporate employees using wellness benefits
3. **Wellness Provider** - Independent facilities (gyms, pools, studios, etc.)
4. **PolyFit Operations** - Internal platform management
5. **Finance/Settlement** - Billing and provider settlement

### Do NOT Introduce Gym-Specific Functionality

**Never implement:**
- Gym member management
- Gym POS (Point of Sale) systems
- Gym staff management
- Gym trainer management
- Gym class scheduling
- Gym reception desk workflows
- Gym inventory management
- Gym-specific financial reporting
- Gym expense tracking
- Gym branch management
- Membership freeze/suspension
- Individual gym subscription management
- Gym-specific customer CRM
- Gym-owner onboarding
- Single-gym analytics
- Gym-specific admin pages

**These are gym-software features, not aggregator features.**

### Preferred Terminology

| Old (Gym Software) | New (PolyFit Aggregator) |
|-------------------|---------------------------|
| Gym | Provider / Wellness Provider |
| Member | Beneficiary / Employee |
| Membership | Benefit / Corporate Benefit |
| Attendance | Visit / Verified Visit |
| Membership Plan | Benefit Access Rule |
| Gym Payment | Provider Settlement |
| Tenant | Organization / Employer |
| Gym Branch | Provider Location |
| Gym Staff | Provider Staff (if applicable) |

---

## Development Rules

### 1. Architecture First

**Always think in terms of the aggregator model:**
- Organization → Benefit → Employee → Provider → Visit → Settlement
- NOT: Gym → Member → Membership → Attendance

### 2. Provider is One of Many

A gym is just one type of wellness provider. The system must work for:
- Gyms
- Swimming pools
- Yoga studios
- Mental wellness providers
- Physiotherapy clinics
- Nutrition services

Never assume the provider is a gym.

### 3. PolyFit is Infrastructure

PolyFit is an aggregation and infrastructure layer. We do not:
- Operate provider facilities
- Manage provider staff
- Handle provider day-to-day operations
- Control provider pricing directly
- Manage provider inventory

We do:
- Connect employers to providers
- Manage eligibility and access
- Track verified usage
- Handle billing and settlement
- Provide reporting and analytics

### 4. Multi-Actor Design

Every feature should consider multiple actors:
- How does this serve employers?
- How does this serve employees?
- How does this serve providers?
- How does this serve PolyFit operations?

### 5. Data Model Design

**Center the model on the aggregator:**
- `organizations` (employers)
- `providers` (wellness providers)
- `provider_locations` (provider facilities)
- `employees` (beneficiaries)
- `benefits` (corporate benefit configurations)
- `eligibility` (employee benefit eligibility)
- `provider_contracts` (provider agreements)
- `visits` (verified employee visits)
- `utilization` (usage analytics)
- `invoices` (employer billing)
- `settlements` (provider settlement)

**NOT:**
- `gyms`
- `gym_members`
- `memberships`
- `gym_attendance`
- `gym_payments`

### 6. API Design

**Routes should reflect the aggregator model:**
- `/api/organizations` - Employer management
- `/api/providers` - Provider management
- `/api/employees` - Employee management
- `/api/benefits` - Benefit configuration
- `/api/eligibility` - Eligibility verification
- `/api/visits` - Visit tracking
- `/api/utilization` - Usage analytics
- `/api/settlements` - Provider settlement
- `/api/reporting` - Employer/provider reporting

**NOT:**
- `/api/gym`
- `/api/members`
- `/api/memberships`
- `/api/attendance`

### 7. UI Design

**Applications should serve specific actors:**
- `/employer` - Employer dashboard
- `/employee` - Employee app interface
- `/provider` - Provider/partner portal
- `/operations` - PolyFit operations console

**NOT:**
- `/gym` - Gym-specific interface
- `/members` - Gym member management
- `/reception` - Gym reception desk

---

## Legacy Product Handling

### The Previous Repository

The repository previously contained gym-management software. That product has been discontinued.

**Do NOT:**
- Recreate, extend, or optimize gym management features
- Reference gym-software patterns unless explicitly requested
- Assume gym-software domain models are relevant
- Use gym-software terminology in new code

**Treat legacy code as deprecated** unless explicitly referenced by current PolyFit requirements.

### Legacy Database

The old database contains gym-software schema:
- `tenants` (gym tenants)
- `memberships` (gym memberships)
- `check_ins` (gym attendance)
- etc.

**Do NOT:**
- Reference old database tables in new code
- Migrate old schema to new architecture
- Assume old database patterns are relevant

The new PolyFit aggregator uses a completely fresh database schema.

---

## Competitive Landscape

### Competitors

PolyFit competes in the **corporate wellness benefits** space, not gym management:

**Corporate Wellness Platforms:**
- RibiRewards
- Benefits Wallet
- Wellness-specific aggregators

**NOT:**
- Mindbody (gym management)
- Gym CRM systems
- Gym POS systems
- Gym scheduling software

### Differentiation

PolyFit is:
- B2B2C (employer-funded)
- Network-based (multiple providers)
- Aggregation-focused (not single-gym)
- East Africa-focused (Rwanda, Kenya, etc.)

---

## Current Phase Priorities

### Focus Areas

1. **Employer Acquisition** - Landing page, demo process, onboarding
2. **Provider Network** - Provider onboarding, contracts, location data
3. **Core Infrastructure** - Eligibility, visits, utilization tracking
4. **Billing & Settlement** - Employer invoicing, provider settlement
5. **Basic Reporting** - Employer utilization reports, provider settlement reports

### Deferred

- Mobile apps (employee app)
- Advanced analytics
- Multi-category expansion (beyond gyms)
- Provider self-service portal
- Employee wellness challenges

---

## Testing & Verification

### Before Marking Features Complete

1. **Terminology Check**: No gym-specific terms in UI, API, or database
2. **Actor Check**: Feature serves clear PolyFit actor(s)
3. **Architecture Check**: Fits aggregator model, not gym-software model
4. **Anti-Bias Check**: Would this feature exist in gym software? If yes, reconsider.

### Code Review Checklist

- [ ] No references to "gym", "member", "membership", "attendance"
- [ ] Uses "provider", "beneficiary/employee", "benefit", "visit"
- [ ] Serves clear PolyFit actor(s)
- [ ] Fits aggregator architecture
- [ ] Database schema uses new model
- [ ] API routes follow aggregator conventions
- [ ] UI serves specific actor(s)

---

## Emergency Override

If you find yourself implementing gym-software features:

**STOP.**

Ask:
1. Is this feature specific to operating a single gym?
2. Would this exist in gym-management software?
3. Does this assume PolyFit operates the provider?

If YES to any:
- This is likely gym-software bias
- Reconsider the feature
- Adapt to aggregator model
- Or defer if not core to current phase

---

## Summary

**PolyFit = Corporate Wellness Aggregator**
**NOT = Gym Management Software**

Keep this distinction in every line of code, every API endpoint, every UI component, and every database table.

When in doubt, ask: "Does this serve the aggregator model or a single gym?"