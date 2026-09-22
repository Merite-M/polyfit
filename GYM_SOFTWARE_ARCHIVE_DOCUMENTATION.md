# Gym Software Archive Documentation

## Archive Information
**Date**: September 22, 2026
**Reason**: Discontinued after PolyFit pivot to corporate wellness aggregator
**Archive Status**: Gym management SaaS - preserved for reference

## Database Information

### Supabase Project
- **Project ID**: `omufxcaifzqepvqbgghc`
- **Status**: Gym software database (to be exported and preserved)
- **Schema**: Gym-centric (tenants, memberships, check_ins, gym operations)
- **Note**: This database will NOT be migrated to the new PolyFit aggregator

### Key Tables (Gym Software Schema)
- `tenants` - Gym tenant records
- `profiles` - Member and staff profiles
- `memberships` - Active and historical membership plans
- `membership_holds` - Membership freezes/holds
- `invoices` - Member and corporate billing invoices
- `payments` - Payment ledger (Cash, Card, MoMo, Tab, Gift Voucher)
- `member_tabs` - Member running tab credit balances
- `family_links` - Dependent and family member associations
- `check_ins` - Real-time access log (Approved, Warning, Denied)
- `corporate_companies` - Corporate accounts and B2B subscription plans
- `communications_log` - Audit trail for multi-channel dispatches
- `staff_tasks` - Staff task assignments and completion statuses
- `facility_rentals` - Court and facility scheduling and reservations
- `gift_vouchers` - Gift voucher codes and balances

## Render Infrastructure

### Gym Software Services
- **Backend Service ID**: `srv-d9the17avr4c73bro63g`
  - Service Name: `polyfit-backend`
  - Type: Web Service (Node.js Express)
  - Purpose: Gym management API, IoT, billing, cron jobs
  
- **Frontend Service ID**: `srv-d9theku5djic739sq62g`
  - Service Name: `polyfit`
  - Type: Static Site (Next.js)
  - Purpose: Gym management UI and landing page

### Domain Information
- **Current Domain**: `polyfit.onrender.com`
- **Migration Plan**: This domain will move to the new PolyFit aggregator services
- **Gym Software**: Will need new domain/subdomain if reactivated

## Environment Variables (Gym Software)

### Backend (.env)
- `SUPABASE_URL` - Gym software Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for gym database
- `FRONTEND_URL` - Allowed CORS origin
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret key for custom token validation
- `INTERNAL_API_KEY` - Internal system-to-system API key
- `PAYPACK_WEBHOOK_SECRET` - HMAC secret for Paypack webhooks
- `MOMO_WEBHOOK_SECRET` - HMAC secret for MTN Mobile Money webhooks
- `AIRTEL_WEBHOOK_SECRET` - HMAC secret for Airtel Money webhooks

### Frontend (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` - Gym software Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key for gym database
- `NEXT_PUBLIC_API_URL` - Backend API base URL

## MCP Integration Information

### Linear
- **Team ID**: `c197d0a6-735c-42f8-b79f-49da27c8d063`
- **Team Name**: GymPartner
- **Status**: Contains gym-software issues (to be cleaned up)

### Stitch
- **Project ID**: `16498663316307719095`
- **Project Name**: GymPartner — Operations Console
- **Status**: Contains gym-software screens (to be cleaned up, keep aggregator designs)

## Archive Actions

### Completed
- [x] Documented Supabase project information
- [x] Documented Render service IDs
- [x] Documented environment variables
- [x] Documented MCP integration information

### Pending
- [ ] Export Supabase database (schema + data)
- [ ] Create GitHub archive repository
- [ ] Push current state to archive
- [ ] Tag with `gym-software-legacy-final`
- [ ] Clean up Linear MCP (delete gym issues)
- [ ] Clean up Stitch MCP (delete gym screens, keep aggregator designs)

## Notes for Future Reference

1. **Database Export**: When exporting Supabase, ensure both schema and data are preserved
2. **Render Services**: Keep gym services running until explicit decommission decision
3. **Domain Migration**: The current domain will move to aggregator, gym software will need new domain
4. **Code Access**: Archive repository will be read-only, accessible via GitHub
5. **Reactivation**: If gym software needs reactivation, will need new infrastructure setup