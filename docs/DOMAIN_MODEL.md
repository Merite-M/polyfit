# PolyFit Domain Model

## Core Entities

### Organization (Employer)

Represents a company or organization that purchases wellness benefits for employees.

**Table: `organizations`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | text | Company name |
| `industry` | text | Industry sector |
| `size` | integer | Number of employees |
| `billing_contact` | text | Billing contact email |
| `billing_address` | text | Billing address |
| `contract_start_date` | date | Contract start date |
| `contract_end_date` | date | Contract end date |
| `benefit_configuration` | jsonb | Benefit configuration details |
| `utilization_limits` | jsonb | Utilization limits and caps |
| `billing_terms` | jsonb | Billing terms and conditions |
| `status` | text | Status (active, suspended, etc.) |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Relationships:**
- Has many `employees`
- Has many `benefits`
- Has many `invoices`

---

### Provider

Represents an independent wellness provider business (gym, pool, studio, etc.).

**Table: `providers`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | text | Provider business name |
| `provider_type` | text | Type (gym, swimming, yoga, mental_wellness, etc.) |
| `contact_email` | text | Contact email |
| `contact_phone` | text | Contact phone |
| `billing_details` | jsonb | Billing and settlement details |
| `contract_terms` | jsonb | Contract terms and conditions |
| `pricing_model` | text | Pricing model (per_visit, per_member, corporate_package, hybrid) |
| `status` | text | Status (active, inactive, suspended) |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Relationships:**
- Has many `provider_locations`
- Has many `provider_contracts`
- Has many `visits`

---

### Provider Location

Represents a physical location of a wellness provider.

**Table: `provider_locations`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `provider_id` | UUID | Foreign key to providers |
| `name` | text | Location name |
| `address` | text | Physical address |
| `latitude` | numeric | GPS latitude |
| `longitude` | numeric | GPS longitude |
| `geofence_radius_meters` | integer | Geofence radius in meters |
| `max_occupancy_limit` | integer | Maximum occupancy |
| `capacity_policy` | text | Capacity policy (hard, soft) |
| `operating_hours` | jsonb | Operating hours |
| `contact_phone` | text | Location contact phone |
| `amenities` | jsonb | Available amenities |
| `status` | text | Status (active, inactive) |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Relationships:**
- Belongs to `provider`
- Has many `visits`

---

### Employee (Beneficiary)

Represents a corporate employee who receives wellness benefits.

**Table: `employees`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign key to organizations |
| `first_name` | text | First name |
| `last_name` | text | Last name |
| `email` | text | Email address |
| `phone` | text | Phone number |
| `employee_id` | text | Company employee ID |
| `department` | text | Department |
| `status` | text | Status (active, inactive, terminated) |
| `hire_date` | date | Hire date |
| `termination_date` | date | Termination date (if applicable) |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Relationships:**
- Belongs to `organization`
- Has many `eligibility` records
- Has many `visits`

---

### Benefit

Represents a corporate benefit configuration.

**Table: `benefits`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign key to organizations |
| `name` | text | Benefit name |
| `benefit_type` | text | Benefit type (fitness, swimming, wellness, etc.) |
| `description` | text | Benefit description |
| `eligibility_criteria` | jsonb | Eligibility criteria |
| `access_rules` | jsonb | Access rules and restrictions |
| `utilization_cap` | jsonb | Utilization limits (visits per month, spend cap, etc.) |
| `cost_structure` | jsonb | Cost structure (per employee, per visit, etc.) |
| `effective_date` | date | Effective start date |
| `expiration_date` | date | Expiration date |
| `status` | text | Status (active, inactive, expired) |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Relationships:**
- Belongs to `organization`
- Has many `eligibility` records

---

### Eligibility

Represents employee benefit eligibility.

**Table: `eligibility`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `employee_id` | UUID | Foreign key to employees |
| `benefit_id` | UUID | Foreign key to benefits |
| `status` | text | Eligibility status (eligible, ineligible, pending) |
| `effective_date` | date | Effective start date |
| `expiration_date` | date | Expiration date |
| `utilization_used` | integer | Utilization used (visits, spend, etc.) |
| `utilization_cap` | integer | Utilization cap |
| `access_restrictions` | jsonb | Access restrictions |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Relationships:**
- Belongs to `employee`
- Belongs to `benefit`

---

### Provider Contract

Represents provider agreements and terms.

**Table: `provider_contracts`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `provider_id` | UUID | Foreign key to providers |
| `contract_type` | text | Contract type |
| `pricing_model` | text | Pricing model |
| `rate_card` | jsonb | Rate card and pricing details |
| `settlement_terms` | jsonb | Settlement terms and frequency |
| `service_level_agreement` | jsonb | SLA details |
| `performance_metrics` | jsonb | Performance metrics and targets |
| `start_date` | date | Contract start date |
| `end_date` | date | Contract end date |
| `status` | text | Status (active, inactive, terminated) |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Relationships:**
- Belongs to `provider`

---

### Visit

Represents a verified employee visit to a provider.

**Table: `visits`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `employee_id` | UUID | Foreign key to employees |
| `provider_location_id` | UUID | Foreign key to provider_locations |
| `eligibility_id` | UUID | Foreign key to eligibility |
| `visit_date` | date | Visit date |
| `check_in_time` | timestamp | Check-in timestamp |
| `check_out_time` | timestamp | Check-out timestamp |
| `verification_method` | text | Verification method (qr_code, nfc, manual, etc.) |
| `verification_status` | text | Verification status (verified, pending, failed) |
| `location_verified` | boolean | Location verification status |
| `status` | text | Visit status (approved, warning, denied) |
| `reason` | text | Status reason (if applicable) |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Relationships:**
- Belongs to `employee`
- Belongs to `provider_location`
- Belongs to `eligibility`

---

### Utilization

Represents usage analytics and tracking.

**Table: `utilization`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `employee_id` | UUID | Foreign key to employees |
| `organization_id` | UUID | Foreign key to organizations |
| `provider_id` | UUID | Foreign key to providers |
| `benefit_id` | UUID | Foreign key to benefits |
| `period` | text | Reporting period (monthly, quarterly, etc.) |
| `visit_count` | integer | Number of visits |
| `total_spend` | numeric | Total spend |
| `utilization_rate` | numeric | Utilization rate |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Relationships:**
- Belongs to `employee`
- Belongs to `organization`
- Belongs to `provider`
- Belongs to `benefit`

---

### Invoice

Represents employer billing.

**Table: `invoices`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_id` | UUID | Foreign key to organizations |
| `invoice_number` | text | Invoice number |
| `billing_period` | text | Billing period |
| `total_amount` | numeric | Total amount |
| `platform_fee` | numeric | Platform fee |
| `usage_charges` | numeric | Usage-based charges |
| `status` | text | Invoice status (draft, sent, paid, overdue) |
| `due_date` | date | Due date |
| `paid_date` | date | Payment date |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Relationships:**
- Belongs to `organization`

---

### Settlement

Represents provider settlement processing.

**Table: `settlements`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `provider_id` | UUID | Foreign key to providers |
| `settlement_number` | text | Settlement number |
| `settlement_period` | text | Settlement period |
| `visit_count` | integer | Number of visits to settle |
| `total_amount` | numeric | Total settlement amount |
| `platform_fee` | numeric | Platform fee deducted |
| `net_amount` | numeric | Net amount to provider |
| `status` | text | Settlement status (pending, processing, paid, failed) |
| `processed_date` | date | Processing date |
| `paid_date` | date | Payment date |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

**Relationships:**
- Belongs to `provider`

---

## Key Relationships

```
Organization (1) ────── (N) Employee
Organization (1) ────── (N) Benefit
Organization (1) ────── (N) Invoice

Provider (1) ────── (N) ProviderLocation
Provider (1) ────── (N) ProviderContract
Provider (1) ────── (N) Visit

Employee (1) ────── (N) Eligibility
Employee (1) ────── (N) Visit
Employee (1) ────── (N) Utilization

Benefit (1) ────── (N) Eligibility

ProviderLocation (1) ────── (N) Visit

Eligibility (1) ────── (N) Visit
```

---

## Anti-Patterns to Avoid

### Gym-Centric Model (DO NOT USE)

```
Gym ────── GymMember ────── Membership ────── Attendance
```

### Correct Aggregator Model

```
Organization ────── Employee ────── Eligibility ────── Visit
Provider ────── ProviderLocation ────── Visit
```

---

## Indexes and Performance

### Recommended Indexes

```sql
-- Organizations
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_contract_dates ON organizations(contract_start_date, contract_end_date);

-- Providers
CREATE INDEX idx_providers_type_status ON providers(provider_type, status);

-- Provider Locations
CREATE INDEX idx_provider_locations_provider ON provider_locations(provider_id);
CREATE INDEX idx_provider_locations_status ON provider_locations(status);
CREATE INDEX idx_provider_locations_coords ON provider_locations(latitude, longitude);

-- Employees
CREATE INDEX idx_employees_organization ON employees(organization_id);
CREATE INDEX idx_employees_status ON employees(status);

-- Benefits
CREATE INDEX idx_benefits_organization ON benefits(organization_id);
CREATE INDEX idx_benefits_status_dates ON benefits(status, effective_date, expiration_date);

-- Eligibility
CREATE INDEX idx_eligibility_employee ON eligibility(employee_id);
CREATE INDEX idx_eligibility_benefit ON eligibility(benefit_id);
CREATE INDEX idx_eligibility_status ON eligibility(status);

-- Visits
CREATE INDEX idx_visits_employee ON visits(employee_id);
CREATE INDEX idx_visits_provider_location ON visits(provider_location_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_status ON visits(status);

-- Utilization
CREATE INDEX idx_utilization_employee ON utilization(employee_id);
CREATE INDEX idx_utilization_organization ON utilization(organization_id);
CREATE INDEX idx_utilization_period ON utilization(period);

-- Invoices
CREATE INDEX idx_invoices_organization ON invoices(organization_id);
CREATE INDEX idx_invoices_status_dates ON invoices(status, due_date);

-- Settlements
CREATE INDEX idx_settlements_provider ON settlements(provider_id);
CREATE INDEX idx_settlements_status_dates ON settlements(status, processed_date);
```

---

## Row-Level Security (RLS) Policies

### Organization Isolation

```sql
-- Organizations: Only accessible by org admins and super admins
CREATE POLICY "Organization access" ON organizations
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE organization_id = organizations.id 
      AND role IN ('admin', 'super_admin')
    )
  );
```

### Provider Isolation

```sql
-- Providers: Only accessible by provider staff and PolyFit admins
CREATE POLICY "Provider access" ON providers
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE provider_id = providers.id 
      AND role IN ('admin', 'staff')
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

### Employee Data Privacy

```sql
-- Employees: Only accessible by their organization and themselves
CREATE POLICY "Employee data access" ON employees
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
    OR
    id = (
      SELECT employee_id FROM profiles 
      WHERE id = auth.uid()
    )
  );
```

---

## Migration Strategy

### Phase 1: Core Tables

1. `organizations`
2. `providers`
3. `provider_locations`
4. `employees`
5. `benefits`
6. `eligibility`

### Phase 2: Operational Tables

7. `provider_contracts`
8. `visits`
9. `utilization`

### Phase 3: Financial Tables

10. `invoices`
11. `settlements`

---

## Data Validation Rules

### Business Logic Constraints

1. **Eligibility Validation**: Employee must belong to organization with active benefit
2. **Visit Validation**: Employee must have active eligibility for visit date
3. **Settlement Validation**: Only verified visits can be settled
4. **Invoice Validation**: Only completed utilization periods can be invoiced
5. **Capacity Validation**: Provider location capacity limits enforced during check-in

### Data Integrity

1. **Foreign Key Constraints**: All relationships enforced
2. **Status Constraints**: Valid status values enforced
3. **Date Validation**: Effective dates < expiration dates
4. **Non-Negative Values**: Counts and amounts must be >= 0