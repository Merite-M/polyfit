import test from 'node:test';
import assert from 'node:assert/strict';

// Re-implement or test pure algorithms to verify business logic correctness
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function extractNeighborhood(address, name) {
  const text = `${address || ''} ${name || ''}`.toLowerCase();
  if (text.includes('kimihurura') || text.includes('kigali heights') || text.includes('kg 7 ave')) return 'Kimihurura';
  if (text.includes('kiyovu') || text.includes('kn 3 ave')) return 'Kiyovu';
  if (text.includes('nyarutarama')) return 'Nyarutarama';
  if (text.includes('gishushu')) return 'Gishushu';
  if (text.includes('remera')) return 'Remera';
  if (text.includes('kacyiru')) return 'Kacyiru';
  if (text.includes('downtown') || text.includes('central') || text.includes('kn 4')) return 'Downtown';
  if (text.includes('kagugu')) return 'Kagugu';
  return 'Kigali Central';
}

function getFacilityOperatingStatus(hours, mockDate = new Date()) {
  if (!hours) {
    return {
      isOpen: true,
      statusText: 'Open today • 06:00 - 22:00',
      statusBadge: 'open',
    };
  }

  const days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  const currentDay = days[mockDate.getDay()];
  const todayHours = hours[currentDay];

  if (!todayHours || !todayHours.open || !todayHours.close) {
    return {
      isOpen: false,
      statusText: 'Closed today',
      statusBadge: 'closed',
    };
  }

  const currentMinutes = mockDate.getHours() * 60 + mockDate.getMinutes();

  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);

  const openMinutes = openH * 60 + (openM || 0);
  const closeMinutes = closeH * 60 + (closeM || 0);

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    const minutesLeft = closeMinutes - currentMinutes;
    if (minutesLeft <= 45) {
      return {
        isOpen: true,
        statusText: `Closing soon • in ${minutesLeft}m`,
        statusBadge: 'closing_soon',
      };
    }

    const formattedClose =
      closeH > 12 ? `${closeH - 12}:${closeM === 0 ? '00' : closeM} PM` : `${closeH}:${closeM === 0 ? '00' : closeM} AM`;

    return {
      isOpen: true,
      statusText: `Open Now • Closes ${formattedClose}`,
      statusBadge: 'open',
    };
  }

  if (currentMinutes < openMinutes) {
    const formattedOpen =
      openH > 12 ? `${openH - 12}:${openM === 0 ? '00' : openM} PM` : `${openH}:${openM === 0 ? '00' : openM} AM`;
    return {
      isOpen: false,
      statusText: `Closed • Opens at ${formattedOpen}`,
      statusBadge: 'closed',
    };
  }

  return {
    isOpen: false,
    statusText: 'Closed for the day',
    statusBadge: 'closed',
  };
}

test('calculateDistanceKm computes accurate distance between Kigali Downtown and Kimihurura', () => {
  const downtown = { lat: -1.9482, lng: 30.0592 };
  const kimihurura = { lat: -1.9536, lng: 30.0924 };
  const dist = calculateDistanceKm(downtown.lat, downtown.lng, kimihurura.lat, kimihurura.lng);
  assert.ok(dist > 3.0 && dist < 4.5, `Expected distance ~3.7km, got ${dist}`);
});

test('extractNeighborhood correctly classifies Kigali neighborhoods from text', () => {
  assert.equal(extractNeighborhood('KG 7 Ave, Kigali Heights', 'Kigali Heights Club'), 'Kimihurura');
  assert.equal(extractNeighborhood('KN 3 Ave', 'Cercle Sportif Kiyovu'), 'Kiyovu');
  assert.equal(extractNeighborhood('KG 9 Ave, Nyarutarama Green Belt', 'Zen Studio'), 'Nyarutarama');
  assert.equal(extractNeighborhood('KG 9 Ave, Gishushu Boulevard', 'CrossFit'), 'Gishushu');
  assert.equal(extractNeighborhood('KG 11 Ave', 'Amahoro Stadium Remera Pool'), 'Remera');
  assert.equal(extractNeighborhood('KG 543 St', 'Inzozi Yoga Kacyiru'), 'Kacyiru');
  assert.equal(extractNeighborhood('KN 4 Ave Commercial District', 'Waka'), 'Downtown');
});

test('getFacilityOperatingStatus reports Open Now during active operating hours', () => {
  const hours = {
    monday: { open: '06:00', close: '22:00' },
  };
  // Mock Monday at 14:30
  const mondayMidday = new Date('2026-10-05T14:30:00'); // Monday
  const status = getFacilityOperatingStatus(hours, mondayMidday);
  assert.equal(status.isOpen, true);
  assert.equal(status.statusBadge, 'open');
  assert.match(status.statusText, /Open Now • Closes 10:00 PM/);
});

test('getFacilityOperatingStatus reports Closing Soon when within 45 minutes of closing', () => {
  const hours = {
    monday: { open: '06:00', close: '22:00' },
  };
  // Mock Monday at 21:35 (25 mins before close)
  const mondayLate = new Date('2026-10-05T21:35:00');
  const status = getFacilityOperatingStatus(hours, mondayLate);
  assert.equal(status.isOpen, true);
  assert.equal(status.statusBadge, 'closing_soon');
  assert.match(status.statusText, /Closing soon • in 25m/);
});

test('getFacilityOperatingStatus reports Closed when outside operating hours', () => {
  const hours = {
    monday: { open: '06:00', close: '22:00' },
  };
  // Mock Monday at 04:30 AM (before open)
  const mondayEarly = new Date('2026-10-05T04:30:00');
  const status = getFacilityOperatingStatus(hours, mondayEarly);
  assert.equal(status.isOpen, false);
  assert.equal(status.statusBadge, 'closed');
  assert.match(status.statusText, /Closed • Opens at 6:00 AM/);
});
