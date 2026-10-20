/**
 * PolyFit Shared Utilities
 * 
 * This package contains utility functions shared across the monorepo.
 * Only include functions that are actively used by multiple packages.
 */

/**
 * Calculates distance in meters between two GPS coordinates using Haversine formula.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters
 */
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Sanitizes user input string before embedding in Supabase PostgREST .or() filter queries.
 * Strips PostgREST structural syntax control characters (parentheses, commas, dots, colons, quotes, percent/underscore wildcards).
 *
 * @param {string} input - Raw user search or filter string
 * @returns {string} Safe string for PostgREST filter interpolation
 */
function sanitizePostgrestFilter(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[\(\),:\\"'\/%_]/g, '').trim();
}

module.exports = {
  getDistanceFromLatLonInM,
  sanitizePostgrestFilter,
};

/**
 * Removed Functions (dead code):
 * - getLiveOccupancy: Not used anywhere in codebase
 * - validateOrganizationAccess: Not used anywhere, references non-existent 'profiles' table
 * - verifyHmacSignature: Not used anywhere
 * - formatRWF: Duplicate implementation exists in apps/web/src/lib/invoice-pdf.ts (used 100+ times)
 * 
 * Note: formatRWF is kept in web/src/lib/invoice-pdf.ts because it's specific to PDF generation
 * and the web app uses a simpler format than the shared version would provide.
 */
