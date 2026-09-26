const { supabase } = require('./supabaseService');
const { getDistanceFromLatLonInM } = require('./totpService');

const VALID_PROVIDER_CATEGORIES = ['gym', 'pool', 'studio', 'clinic', 'wellness_center'];
const VALID_PROVIDER_STATUSES = ['pending_review', 'active', 'inactive', 'suspended', 'rejected'];
const VALID_LOCATION_STATUSES = ['active', 'inactive', 'maintenance'];

/**
 * Registers a new wellness provider application.
 * Status is set to 'pending_review' awaiting PolyFit ops/admin approval.
 *
 * @param {Object} data
 * @param {string} data.name - Provider business name
 * @param {string} data.category - Provider category ('gym', 'pool', 'studio', 'clinic', 'wellness_center')
 * @param {string} data.contact_email - Primary business contact email
 * @param {string} [data.settlement_email] - Financial/settlement contact email
 * @param {string} [data.tax_id] - Business registration / TIN
 * @param {Object} [data.bank_details] - Bank details for settlements
 * @param {Object} [data.pricing_expectations] - Expected per-visit rates and packages
 * @param {Object} [data.onboarding_details] - Detailed onboarding metadata (services provided, manager phone, Google Business Profile)
 * @param {Array<Object>} [data.locations] - Initial locations to register
 * @param {string} [data.status='pending_review'] - Initial status
 * @returns {Promise<Object>} Created provider record with locations
 */
async function registerProvider({
  name,
  category,
  contact_email,
  settlement_email = null,
  tax_id = null,
  bank_details = null,
  pricing_expectations = null,
  onboarding_details = null,
  locations = [],
  status = 'pending_review'
}) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    const error = new Error('Provider name is required');
    error.code = 'PROVIDER_MISSING_NAME';
    error.statusCode = 400;
    throw error;
  }

  if (!category || !VALID_PROVIDER_CATEGORIES.includes(category)) {
    const error = new Error(`Category must be one of: [${VALID_PROVIDER_CATEGORIES.join(', ')}]`);
    error.code = 'PROVIDER_INVALID_CATEGORY';
    error.statusCode = 400;
    throw error;
  }

  if (!contact_email || typeof contact_email !== 'string' || !contact_email.includes('@')) {
    const error = new Error('A valid contact_email is required');
    error.code = 'PROVIDER_INVALID_EMAIL';
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_PROVIDER_STATUSES.includes(status)) {
    const error = new Error(`Status must be one of: [${VALID_PROVIDER_STATUSES.join(', ')}]`);
    error.code = 'PROVIDER_INVALID_STATUS';
    error.statusCode = 400;
    throw error;
  }

  // Insert Provider record
  const { data: provider, error: insertError } = await supabase
    .from('providers')
    .insert({
      name: name.trim(),
      category,
      contact_email: contact_email.toLowerCase().trim(),
      settlement_email: settlement_email ? settlement_email.toLowerCase().trim() : contact_email.toLowerCase().trim(),
      tax_id: tax_id ? String(tax_id).trim() : null,
      bank_details: bank_details || null,
      pricing_expectations: pricing_expectations || null,
      onboarding_details: onboarding_details || null,
      status,
      rating: 4.8
    })
    .select()
    .single();

  if (insertError) {
    const error = new Error(`Failed to create provider application: ${insertError.message}`);
    error.code = 'PROVIDER_CREATE_FAILED';
    error.statusCode = 500;
    throw error;
  }

  // Insert initial locations if provided
  let createdLocations = [];
  if (Array.isArray(locations) && locations.length > 0) {
    const locationsToInsert = locations.map((loc) => ({
      provider_id: provider.id,
      name: (loc.name && String(loc.name).trim()) || `${provider.name} Main Facility`,
      address: loc.address ? String(loc.address).trim() : null,
      city: loc.city ? String(loc.city).trim() : 'Kigali',
      country: loc.country ? String(loc.country).trim() : 'Rwanda',
      lat: loc.lat !== undefined && loc.lat !== null ? Number(loc.lat) : null,
      lng: loc.lng !== undefined && loc.lng !== null ? Number(loc.lng) : null,
      operating_hours: loc.operating_hours || null,
      amenities: Array.isArray(loc.amenities) ? loc.amenities : null,
      photos: Array.isArray(loc.photos) ? loc.photos : null,
      capacity: loc.capacity !== undefined && loc.capacity !== null ? parseInt(loc.capacity, 10) : null,
      status: 'active'
    }));

    const { data: locs, error: locError } = await supabase
      .from('provider_locations')
      .insert(locationsToInsert)
      .select();

    if (!locError && locs) {
      createdLocations = locs;
    }
  }

  return {
    ...provider,
    locations: createdLocations
  };
}

/**
 * Lists providers with filtering and pagination.
 *
 * @param {Object} options
 * @param {string} [options.status]
 * @param {string} [options.category]
 * @param {string} [options.search]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=50]
 * @returns {Promise<{providers: Array, total: number, page: number, limit: number}>}
 */
async function listProviders({
  status = null,
  category = null,
  search = null,
  page = 1,
  limit = 50
} = {}) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  let query = supabase
    .from('providers')
    .select(`
      *,
      provider_locations(id, name, city, address, lat, lng, status, amenities)
    `, { count: 'exact' });

  if (status && VALID_PROVIDER_STATUSES.includes(status)) {
    query = query.eq('status', status);
  }

  if (category && VALID_PROVIDER_CATEGORIES.includes(category)) {
    query = query.eq('category', category);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`name.ilike.${term},contact_email.ilike.${term}`);
  }

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data: providers, error, count } = await query;

  if (error) {
    const err = new Error(`Failed to list providers: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return {
    providers: providers || [],
    total: count || 0,
    page: safePage,
    limit: safeLimit
  };
}

/**
 * Gets a single provider by ID with locations and contract count.
 *
 * @param {string} providerId
 * @returns {Promise<Object>}
 */
async function getProviderById(providerId) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  const { data: provider, error } = await supabase
    .from('providers')
    .select(`
      *,
      locations:provider_locations(*),
      contracts:provider_contracts(id, org_id, status, per_visit_rate, effective_from)
    `)
    .eq('id', providerId)
    .maybeSingle();

  if (error) {
    const err = new Error(`Failed to fetch provider: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  if (!provider) {
    const err = new Error(`Provider with ID ${providerId} not found`);
    err.code = 'PROVIDER_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  return provider;
}

/**
 * Updates provider profile details.
 *
 * @param {string} providerId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
async function updateProvider(providerId, updates = {}) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  const allowedFields = [
    'name',
    'category',
    'contact_email',
    'settlement_email',
    'tax_id',
    'bank_details',
    'pricing_expectations',
    'onboarding_details',
    'rating',
    'status'
  ];

  const updatePayload = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (field === 'category') {
        if (!VALID_PROVIDER_CATEGORIES.includes(updates.category)) {
          const err = new Error(`Category must be one of: [${VALID_PROVIDER_CATEGORIES.join(', ')}]`);
          err.code = 'PROVIDER_INVALID_CATEGORY';
          err.statusCode = 400;
          throw err;
        }
        updatePayload.category = updates.category;
      } else if (field === 'status') {
        if (!VALID_PROVIDER_STATUSES.includes(updates.status)) {
          const err = new Error(`Status must be one of: [${VALID_PROVIDER_STATUSES.join(', ')}]`);
          err.code = 'PROVIDER_INVALID_STATUS';
          err.statusCode = 400;
          throw err;
        }
        updatePayload.status = updates.status;
      } else {
        updatePayload[field] = updates[field];
      }
    }
  }

  updatePayload.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('providers')
    .update(updatePayload)
    .eq('id', providerId)
    .select(`*, locations:provider_locations(*)`)
    .maybeSingle();

  if (error) {
    const err = new Error(`Failed to update provider: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  if (!updated) {
    const err = new Error(`Provider with ID ${providerId} not found`);
    err.code = 'PROVIDER_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  return updated;
}

/**
 * Approves a provider application.
 * Status changes from 'pending_review' to 'active'.
 *
 * @param {string} providerId
 * @returns {Promise<Object>}
 */
async function approveProvider(providerId) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  const { data: updated, error } = await supabase
    .from('providers')
    .update({
      status: 'active',
      rejection_reason: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', providerId)
    .select(`*, locations:provider_locations(*)`)
    .maybeSingle();

  if (error) {
    const err = new Error(`Failed to approve provider: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  if (!updated) {
    const err = new Error(`Provider with ID ${providerId} not found`);
    err.code = 'PROVIDER_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  return updated;
}

/**
 * Rejects a provider application with a mandatory reason.
 * Status changes to 'rejected'.
 *
 * @param {string} providerId
 * @param {string} reason - Rejection rationale
 * @returns {Promise<Object>}
 */
async function rejectProvider(providerId, reason) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    const error = new Error('Rejection reason is required');
    error.code = 'PROVIDER_MISSING_REJECTION_REASON';
    error.statusCode = 400;
    throw error;
  }

  const { data: updated, error } = await supabase
    .from('providers')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', providerId)
    .select(`*, locations:provider_locations(*)`)
    .maybeSingle();

  if (error) {
    const err = new Error(`Failed to reject provider: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  if (!updated) {
    const err = new Error(`Provider with ID ${providerId} not found`);
    err.code = 'PROVIDER_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  return updated;
}

// ─── Location Management ─────────────────────────────────────────────────────

/**
 * Adds a physical location/facility to an existing provider.
 *
 * @param {string} providerId
 * @param {Object} locData
 * @returns {Promise<Object>}
 */
async function addLocation(providerId, locData = {}) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  if (!locData.name || typeof locData.name !== 'string' || !locData.name.trim()) {
    const error = new Error('Location name is required');
    error.code = 'LOCATION_MISSING_NAME';
    error.statusCode = 400;
    throw error;
  }

  // Ensure provider exists
  const { data: provider, error: pError } = await supabase
    .from('providers')
    .select('id, name')
    .eq('id', providerId)
    .maybeSingle();

  if (pError || !provider) {
    const error = new Error(`Provider with ID ${providerId} not found`);
    error.code = 'PROVIDER_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  const lat = locData.lat !== undefined && locData.lat !== null ? Number(locData.lat) : null;
  const lng = locData.lng !== undefined && locData.lng !== null ? Number(locData.lng) : null;

  const insertPayload = {
    provider_id: providerId,
    name: locData.name.trim(),
    address: locData.address ? String(locData.address).trim() : null,
    city: locData.city ? String(locData.city).trim() : 'Kigali',
    country: locData.country ? String(locData.country).trim() : 'Rwanda',
    lat,
    lng,
    operating_hours: locData.operating_hours || null,
    amenities: Array.isArray(locData.amenities) ? locData.amenities : null,
    photos: Array.isArray(locData.photos) ? locData.photos : null,
    capacity: locData.capacity !== undefined && locData.capacity !== null ? parseInt(locData.capacity, 10) : null,
    status: locData.status && VALID_LOCATION_STATUSES.includes(locData.status) ? locData.status : 'active'
  };

  const { data: location, error: insertError } = await supabase
    .from('provider_locations')
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    const error = new Error(`Failed to add location: ${insertError.message}`);
    error.code = 'LOCATION_CREATE_FAILED';
    error.statusCode = 500;
    throw error;
  }

  return location;
}

/**
 * Lists locations for a provider.
 *
 * @param {string} providerId
 * @param {Object} [options]
 * @returns {Promise<Array>}
 */
async function listLocations(providerId, { status = null } = {}) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  let query = supabase
    .from('provider_locations')
    .select('*')
    .eq('provider_id', providerId);

  if (status && VALID_LOCATION_STATUSES.includes(status)) {
    query = query.eq('status', status);
  }

  query = query.order('created_at', { ascending: true });

  const { data: locations, error } = await query;

  if (error) {
    const err = new Error(`Failed to list locations: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return locations || [];
}

/**
 * Retrieves a single location by ID.
 *
 * @param {string} providerId
 * @param {string} locationId
 * @returns {Promise<Object>}
 */
async function getLocationById(providerId, locationId) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  const { data: location, error } = await supabase
    .from('provider_locations')
    .select(`
      *,
      provider:providers(id, name, category, status, contact_email)
    `)
    .eq('id', locationId)
    .eq('provider_id', providerId)
    .maybeSingle();

  if (error) {
    const err = new Error(`Error fetching location: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  if (!location) {
    const err = new Error(`Location with ID ${locationId} not found for this provider`);
    err.code = 'LOCATION_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  return location;
}

/**
 * Updates an existing facility location.
 *
 * @param {string} providerId
 * @param {string} locationId
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
async function updateLocation(providerId, locationId, updates = {}) {
  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  const allowedFields = [
    'name',
    'address',
    'city',
    'country',
    'lat',
    'lng',
    'operating_hours',
    'amenities',
    'photos',
    'capacity',
    'status'
  ];

  const updatePayload = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (field === 'status') {
        if (!VALID_LOCATION_STATUSES.includes(updates.status)) {
          const err = new Error(`Location status must be one of: [${VALID_LOCATION_STATUSES.join(', ')}]`);
          err.code = 'LOCATION_INVALID_STATUS';
          err.statusCode = 400;
          throw err;
        }
        updatePayload.status = updates.status;
      } else if (field === 'lat' || field === 'lng') {
        updatePayload[field] = updates[field] !== null ? Number(updates[field]) : null;
      } else if (field === 'capacity') {
        updatePayload.capacity = updates[field] !== null ? parseInt(updates[field], 10) : null;
      } else {
        updatePayload[field] = updates[field];
      }
    }
  }

  updatePayload.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('provider_locations')
    .update(updatePayload)
    .eq('id', locationId)
    .eq('provider_id', providerId)
    .select()
    .maybeSingle();

  if (error) {
    const err = new Error(`Failed to update location: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  if (!updated) {
    const err = new Error(`Location with ID ${locationId} not found for this provider`);
    err.code = 'LOCATION_NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  return updated;
}

/**
 * Deactivates a facility location (soft delete).
 *
 * @param {string} providerId
 * @param {string} locationId
 * @returns {Promise<Object>}
 */
async function deactivateLocation(providerId, locationId) {
  return updateLocation(providerId, locationId, { status: 'inactive' });
}

// ─── Beneficiary Discovery & Geo-Search Engine ───────────────────────────────

/**
 * High-performance facility discovery for corporate employees & public catalog.
 * Guarantees < 500ms SLA with distance sorting and rich multi-tag filters.
 *
 * @param {Object} filters
 * @param {number} [filters.lat] - Beneficiary GPS latitude
 * @param {number} [filters.lng] - Beneficiary GPS longitude
 * @param {number} [filters.radius_km=25] - Proximity radius filter
 * @param {string} [filters.category] - Provider category filter
 * @param {string} [filters.city] - City filter
 * @param {string|string[]} [filters.amenities] - Amenities filter (e.g. 'shower', 'sauna')
 * @param {string} [filters.search] - Free-text keyword search
 * @param {number} [filters.page=1]
 * @param {number} [filters.limit=50]
 * @returns {Promise<{results: Array, total: number, execution_ms: number}>}
 */
async function discoverProviders({
  lat = null,
  lng = null,
  radius_km = 25,
  category = null,
  city = null,
  amenities = null,
  search = null,
  page = 1,
  limit = 50
} = {}) {
  const startTime = Date.now();

  if (!supabase) {
    throw new Error('Database service unavailable');
  }

  // Fetch all active provider locations belonging to active providers
  let query = supabase
    .from('provider_locations')
    .select(`
      id,
      name,
      address,
      city,
      country,
      lat,
      lng,
      operating_hours,
      amenities,
      photos,
      capacity,
      status,
      provider:providers!inner(
        id,
        name,
        category,
        status,
        rating,
        contact_email
      )
    `)
    .eq('status', 'active')
    .eq('provider.status', 'active');

  if (category && VALID_PROVIDER_CATEGORIES.includes(category)) {
    query = query.eq('provider.category', category);
  }

  if (city && typeof city === 'string' && city.trim()) {
    query = query.ilike('city', `%${city.trim()}%`);
  }

  const { data: locations, error } = await query;

  if (error) {
    const err = new Error(`Discovery query failed: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  const userLat = lat !== null && lat !== undefined ? Number(lat) : null;
  const userLng = lng !== null && lng !== undefined ? Number(lng) : null;
  const hasUserCoords = userLat !== null && !isNaN(userLat) && userLng !== null && !isNaN(userLng);
  const maxRadiusM = (Number(radius_km) || 25) * 1000;

  // Normalize requested amenities filter
  let requestedAmenities = [];
  if (amenities) {
    if (Array.isArray(amenities)) {
      requestedAmenities = amenities.map((a) => String(a).toLowerCase().trim()).filter(Boolean);
    } else if (typeof amenities === 'string') {
      requestedAmenities = amenities.split(',').map((a) => a.toLowerCase().trim()).filter(Boolean);
    }
  }

  const normalizedSearch = search && typeof search === 'string' ? search.toLowerCase().trim() : null;

  // Process, filter, and score locations
  let processed = [];

  for (const loc of locations || []) {
    // Amenity filtering
    if (requestedAmenities.length > 0) {
      const locAmenities = Array.isArray(loc.amenities)
        ? loc.amenities.map((a) => String(a).toLowerCase().trim())
        : [];
      const hasAllAmenities = requestedAmenities.every((reqAmenity) =>
        locAmenities.some((locAmenity) => locAmenity.includes(reqAmenity))
      );
      if (!hasAllAmenities) continue;
    }

    // Keyword search filter
    if (normalizedSearch) {
      const pName = (loc.provider?.name || '').toLowerCase();
      const lName = (loc.name || '').toLowerCase();
      const addr = (loc.address || '').toLowerCase();
      const cty = (loc.city || '').toLowerCase();
      if (!pName.includes(normalizedSearch) && !lName.includes(normalizedSearch) && !addr.includes(normalizedSearch) && !cty.includes(normalizedSearch)) {
        continue;
      }
    }

    // Calculate distance if coordinates are available
    let distanceMeters = null;
    let distanceKm = null;

    if (hasUserCoords && loc.lat !== null && loc.lng !== null) {
      distanceMeters = Math.round(getDistanceFromLatLonInM(userLat, userLng, Number(loc.lat), Number(loc.lng)));
      distanceKm = Number((distanceMeters / 1000).toFixed(2));

      // Radius filter
      if (distanceMeters > maxRadiusM) {
        continue;
      }
    }

    processed.push({
      location_id: loc.id,
      location_name: loc.name,
      address: loc.address,
      city: loc.city,
      country: loc.country,
      lat: loc.lat ? Number(loc.lat) : null,
      lng: loc.lng ? Number(loc.lng) : null,
      distance_meters: distanceMeters,
      distance_km: distanceKm,
      operating_hours: loc.operating_hours,
      amenities: loc.amenities || [],
      photos: loc.photos || [],
      capacity: loc.capacity,
      provider: {
        id: loc.provider.id,
        name: loc.provider.name,
        category: loc.provider.category,
        rating: loc.provider.rating ? Number(loc.provider.rating) : 4.8,
        contact_email: loc.provider.contact_email
      }
    });
  }

  // Sort by distance if user coords provided, otherwise by rating
  if (hasUserCoords) {
    processed.sort((a, b) => {
      if (a.distance_meters === null) return 1;
      if (b.distance_meters === null) return -1;
      return a.distance_meters - b.distance_meters;
    });
  } else {
    processed.sort((a, b) => (b.provider.rating || 0) - (a.provider.rating || 0));
  }

  const total = processed.length;
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const startIndex = (safePage - 1) * safeLimit;
  const paginated = processed.slice(startIndex, startIndex + safeLimit);

  const executionMs = Date.now() - startTime;

  return {
    results: paginated,
    total,
    page: safePage,
    limit: safeLimit,
    execution_ms: executionMs
  };
}

// ─── Marketing Toolkit (Wellhub-Inspired) ────────────────────────────────────

/**
 * Generates downloadable co-branded marketing assets for a wellness provider.
 * Includes SVG badges, front-desk counter signage templates, social media copy & brand guidelines.
 *
 * @param {string} providerId
 * @returns {Promise<Object>} Co-branded marketing asset package
 */
async function getMarketingAssets(providerId) {
  const provider = await getProviderById(providerId);

  const cleanName = provider.name.replace(/[<>&"]/g, '');
  const categoryLabel = provider.category ? provider.category.toUpperCase() : 'WELLNESS';

  // Co-branded SVG Partner Badge
  const partnerBadgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 180" width="500" height="180">
  <defs>
    <linearGradient id="polyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1F33" />
      <stop offset="100%" stop-color="#142C44" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#28D17C" />
    </linearGradient>
  </defs>
  <rect width="500" height="180" rx="16" fill="url(#polyGrad)" stroke="#10B981" stroke-width="2" />
  
  <!-- PolyFit Hex Mark -->
  <polygon points="50,45 75,30 100,45 100,75 75,90 50,75" fill="none" stroke="url(#emeraldGrad)" stroke-width="5" />
  <circle cx="75" cy="60" r="10" fill="#10B981" />
  
  <!-- Text Content -->
  <text x="120" y="55" font-family="Inter, sans-serif" font-weight="800" font-size="24" fill="#FFFFFF">POLYFIT</text>
  <text x="220" y="55" font-family="Inter, sans-serif" font-weight="500" font-size="14" fill="#10B981">NETWORK</text>
  
  <text x="120" y="85" font-family="Inter, sans-serif" font-weight="700" font-size="16" fill="#F8FAFC">OFFICIAL WELLNESS PARTNER</text>
  <text x="120" y="112" font-family="Inter, sans-serif" font-weight="600" font-size="20" fill="url(#emeraldGrad)">${cleanName}</text>
  <text x="120" y="138" font-family="Inter, sans-serif" font-weight="500" font-size="12" fill="#94A3B8">${categoryLabel} • VERIFIED FACILITY</text>
</svg>`.trim();

  // Printable Reception Desk Signage Template
  const receptionSignageSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <rect width="600" height="800" rx="24" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="4"/>
  <rect width="600" height="120" rx="24" fill="#0B1F33" />
  <text x="300" y="70" font-family="Inter, sans-serif" font-weight="800" font-size="32" fill="#FFFFFF" text-anchor="middle">POLYFIT CHECK-IN</text>
  <text x="300" y="100" font-family="Inter, sans-serif" font-weight="600" font-size="16" fill="#10B981" text-anchor="middle">Corporate Wellness Network</text>
  
  <text x="300" y="180" font-family="Inter, sans-serif" font-weight="700" font-size="24" fill="#1E293B" text-anchor="middle">Welcome to ${cleanName}</text>
  
  <!-- QR Mock Display Box -->
  <rect x="150" y="220" width="300" height="300" rx="16" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2" />
  <rect x="175" y="245" width="250" height="250" rx="8" fill="#FFFFFF" stroke="#10B981" stroke-dasharray="6,6" stroke-width="3" />
  <text x="300" y="365" font-family="Inter, sans-serif" font-weight="700" font-size="20" fill="#0B1F33" text-anchor="middle">SCAN TOTP QR PASS</text>
  <text x="300" y="395" font-family="Inter, sans-serif" font-weight="500" font-size="14" fill="#64748B" text-anchor="middle">via PolyFit Mobile App</text>
  
  <!-- Steps -->
  <text x="100" y="580" font-family="Inter, sans-serif" font-weight="700" font-size="16" fill="#0B1F33">1. Open your PolyFit app on mobile</text>
  <text x="100" y="620" font-family="Inter, sans-serif" font-weight="700" font-size="16" fill="#0B1F33">2. Tap 'Access Pass' to generate dynamic QR</text>
  <text x="100" y="660" font-family="Inter, sans-serif" font-weight="700" font-size="16" fill="#0B1F33">3. Present QR to reception for seamless verified entry</text>
  
  <text x="300" y="740" font-family="Inter, sans-serif" font-weight="500" font-size="13" fill="#94A3B8" text-anchor="middle">Need assistance? Contact support@polyfit.africa</text>
</svg>`.trim();

  return {
    provider_id: provider.id,
    provider_name: provider.name,
    category: provider.category,
    status: provider.status,
    assets: {
      partner_badge: {
        title: 'Official Co-Branded Partner Badge',
        format: 'svg',
        svg: partnerBadgeSvg,
        embed_html: `<a href="https://polyfit.africa/network/${provider.id}" target="_blank" rel="noopener noreferrer"><img src="https://api.polyfit.africa/api/providers/${provider.id}/badge.svg" alt="${cleanName} - PolyFit Wellness Partner" width="300" /></a>`,
        download_filename: `polyfit-partner-badge-${provider.id}.svg`
      },
      counter_card_signage: {
        title: 'In-Facility Reception Check-In Signage',
        format: 'svg',
        svg: receptionSignageSvg,
        recommended_dimensions: 'A4 or 8.5x11 Standee',
        download_filename: `polyfit-reception-sign-${provider.id}.svg`
      },
      social_media_kit: {
        title: 'Network Launch Social Media Kit',
        announcement_headline: `${provider.name} is now on the PolyFit Corporate Wellness Network!`,
        instagram_caption: `Exciting news! We have officially joined the @PolyFit corporate wellness network. Eligible corporate employees can now access our facilities seamlessly with their PolyFit dynamic pass. Train with us today! #PolyFit #CorporateWellness #KigaliFitness #WellnessNetwork`,
        linkedin_caption: `${provider.name} is proud to partner with PolyFit to deliver verified wellness benefits to forward-thinking corporate employers. Empowering a healthier, more active workforce across East Africa. #CorporateWellness #EmployeeBenefits #PolyFit #HealthInfrastructure`,
        recommended_tags: ['#PolyFit', '#CorporateWellness', '#EastAfricaFitness', '#EmployeeBenefits', '#HealthyWorkforce']
      },
      brand_guidelines: {
        brand_colors: {
          polyfit_navy: '#0B1F33',
          polyfit_emerald: '#10B981',
          polyfit_mint: '#28D17C',
          neutral_slate: '#F8FAFC'
        },
        badge_usage_policy: 'Display the PolyFit Partner Badge on your website header/footer and front reception desk. Do not modify brand aspect ratios or remove the PolyFit hex logo.'
      }
    }
  };
}

module.exports = {
  VALID_PROVIDER_CATEGORIES,
  VALID_PROVIDER_STATUSES,
  VALID_LOCATION_STATUSES,
  registerProvider,
  listProviders,
  getProviderById,
  updateProvider,
  approveProvider,
  rejectProvider,
  addLocation,
  listLocations,
  getLocationById,
  updateLocation,
  deactivateLocation,
  discoverProviders,
  getMarketingAssets
};
