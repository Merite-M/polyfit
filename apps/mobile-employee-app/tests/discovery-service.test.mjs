import test from 'node:test';
import assert from 'node:assert/strict';

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371;

// Optimized calculateDistanceKm algorithm matching discovery-service.ts
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const sinDLat2 = Math.sin(dLat / 2);
  const sinDLon2 = Math.sin(dLon / 2);
  const a =
    sinDLat2 * sinDLat2 +
    Math.cos(lat1 * DEG_TO_RAD) *
      Math.cos(lat2 * DEG_TO_RAD) *
      sinDLon2 *
      sinDLon2;

  const c = 2 * Math.asin(Math.sqrt(Math.min(1, a)));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
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

const DAYS_OF_WEEK = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function parseTimeStr(timeStr) {
  const colonIdx = timeStr.indexOf(':');
  if (colonIdx === -1) {
    const h = parseInt(timeStr, 10) || 0;
    return [h, 0];
  }
  const h = parseInt(timeStr.slice(0, colonIdx), 10) || 0;
  const m = parseInt(timeStr.slice(colonIdx + 1), 10) || 0;
  return [h, m];
}

function formatHourMinute(h, m) {
  const mStr = m === 0 ? '00' : m < 10 ? `0${m}` : `${m}`;
  if (h === 0) return `12:${mStr} AM`;
  if (h === 12) return `12:${mStr} PM`;
  if (h > 12) return `${h - 12}:${mStr} PM`;
  return `${h}:${mStr} AM`;
}

function getFacilityOperatingStatus(hours, mockDate = new Date()) {
  if (!hours) {
    return {
      isOpen: true,
      statusText: 'Open today • 06:00 - 22:00',
      statusBadge: 'open',
    };
  }

  const currentDay = DAYS_OF_WEEK[mockDate.getDay()];
  const todayHours = hours[currentDay];

  if (!todayHours || !todayHours.open || !todayHours.close) {
    return {
      isOpen: false,
      statusText: 'Closed today',
      statusBadge: 'closed',
    };
  }

  const currentMinutes = mockDate.getHours() * 60 + mockDate.getMinutes();

  const [openH, openM] = parseTimeStr(todayHours.open);
  const [closeH, closeM] = parseTimeStr(todayHours.close);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    const minutesLeft = closeMinutes - currentMinutes;
    if (minutesLeft <= 45) {
      return {
        isOpen: true,
        statusText: `Closing soon • in ${minutesLeft}m`,
        statusBadge: 'closing_soon',
      };
    }

    return {
      isOpen: true,
      statusText: `Open Now • Closes ${formatHourMinute(closeH, closeM)}`,
      statusBadge: 'open',
    };
  }

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      statusText: `Closed • Opens at ${formatHourMinute(openH, openM)}`,
      statusBadge: 'closed',
    };
  }

  const nextDay = DAYS_OF_WEEK[(mockDate.getDay() + 1) % 7];
  const nextHours = hours[nextDay];
  if (nextHours && nextHours.open) {
    const [nextH, nextM] = parseTimeStr(nextHours.open);
    return {
      isOpen: false,
      statusText: `Closed • Opens tomorrow ${formatHourMinute(nextH, nextM)}`,
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

test('getFacilityOperatingStatus reports Closed and opens tomorrow with correct next day hours', () => {
  const hours = {
    monday: { open: '06:00', close: '22:00' },
    tuesday: { open: '05:30', close: '21:00' },
  };
  // Mock Monday at 23:00 (after close)
  const mondayNight = new Date('2026-10-05T23:00:00');
  const status = getFacilityOperatingStatus(hours, mondayNight);
  assert.equal(status.isOpen, false);
  assert.equal(status.statusBadge, 'closed');
  assert.match(status.statusText, /Closed • Opens tomorrow 5:30 AM/);
});

test('parseTimeStr and formatHourMinute handle noon, midnight, and minutes cleanly', () => {
  assert.deepEqual(parseTimeStr('12:00'), [12, 0]);
  assert.deepEqual(parseTimeStr('00:05'), [0, 5]);
  assert.deepEqual(parseTimeStr('23:45'), [23, 45]);
  assert.equal(formatHourMinute(12, 0), '12:00 PM');
  assert.equal(formatHourMinute(0, 5), '12:05 AM');
  assert.equal(formatHourMinute(23, 45), '11:45 PM');
  assert.equal(formatHourMinute(9, 30), '9:30 AM');
});
