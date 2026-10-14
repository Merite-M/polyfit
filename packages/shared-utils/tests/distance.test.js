const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { getDistanceFromLatLonInM } = require("../src/index");

/**
 * Helper to check if actual distance is within tolerance (delta in meters) of expected.
 */
function assertApproxEqual(actual, expected, toleranceMeters = 1, message = "") {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= toleranceMeters,
    `${message} Expected ${actual} to be within ${toleranceMeters}m of ${expected} (diff: ${diff}m)`
  );
}

describe("shared-utils: getDistanceFromLatLonInM", () => {
  describe("Zero distance & Same location", () => {
    test("returns 0 for identical coordinates in Kigali", () => {
      const dist = getDistanceFromLatLonInM(-1.9441, 30.0619, -1.9441, 30.0619);
      assert.equal(dist, 0);
    });

    test("returns 0 for origin (0, 0)", () => {
      const dist = getDistanceFromLatLonInM(0, 0, 0, 0);
      assert.equal(dist, 0);
    });

    test("returns 0 for extreme coordinates at North Pole", () => {
      const dist = getDistanceFromLatLonInM(90, 180, 90, 180);
      assert.equal(dist, 0);
    });
  });

  describe("Short distance & Local gym check-in radius", () => {
    test("calculates distance between Kigali Convention Centre and Kigali Heights (~207m)", () => {
      // Kigali Convention Centre (-1.9536, 30.0926) -> Kigali Heights (-1.9525, 30.0911)
      const dist = getDistanceFromLatLonInM(-1.9536, 30.0926, -1.9525, 30.0911);
      // Spherical Earth R = 6,371,000m calculation gives ~206.76 meters
      assertApproxEqual(dist, 206.76, 1, "KCC to Kigali Heights distance");
    });
  });

  describe("Medium distance & Inter-city", () => {
    test("calculates distance between Kigali and Musanze (~68.5km)", () => {
      // Kigali (-1.9441, 30.0619) -> Musanze (-1.4998, 29.6349)
      const dist = getDistanceFromLatLonInM(-1.9441, 30.0619, -1.4998, 29.6349);
      // Spherical Earth R = 6,371,000m calculation gives 68,506.0 meters
      assertApproxEqual(dist, 68506, 1, "Kigali to Musanze distance");
    });
  });

  describe("Long distance & Cross-border / Global", () => {
    test("calculates distance crossing Equator (Nairobi to Kampala)", () => {
      // Nairobi (-1.286389, 36.817223) -> Kampala (0.313611, 32.581111)
      const dist = getDistanceFromLatLonInM(-1.286389, 36.817223, 0.313611, 32.581111);
      // Spherical Earth R = 6,371,000m calculation gives 503,483.3 meters
      assertApproxEqual(dist, 503483.3, 1, "Nairobi to Kampala distance");
    });

    test("calculates distance crossing Prime Meridian (London to Paris)", () => {
      // Greenwich, London (51.4769, 0.0005) -> Paris (48.8566, 2.3522)
      const dist = getDistanceFromLatLonInM(51.4769, 0.0005, 48.8566, 2.3522);
      // Spherical Earth R = 6,371,000m calculation gives 336,038.8 meters
      assertApproxEqual(dist, 336038.8, 1, "London to Paris distance");
    });

    test("calculates intercontinental distance (Kigali to London)", () => {
      // Kigali (-1.9441, 30.0619) -> London (51.5074, -0.1278)
      const dist = getDistanceFromLatLonInM(-1.9441, 30.0619, 51.5074, -0.1278);
      // Spherical Earth R = 6,371,000m calculation gives 6,589,503.2 meters
      assertApproxEqual(dist, 6589503.2, 1, "Kigali to London distance");
    });
  });

  describe("Extremes & Poles", () => {
    test("calculates North Pole to South Pole distance (~half circumference of Earth)", () => {
      const dist = getDistanceFromLatLonInM(90, 0, -90, 0);
      // Expected R * PI = 6371000 * Math.PI = 20015086.79 meters
      const expected = 6371e3 * Math.PI;
      assertApproxEqual(dist, expected, 1, "North Pole to South Pole");
    });
  });

  describe("Symmetry & Invariance", () => {
    test("distance from A to B equals distance from B to A", () => {
      const p1 = [-1.9441, 30.0619];
      const p2 = [-1.4998, 29.6349];
      const distAtoB = getDistanceFromLatLonInM(p1[0], p1[1], p2[0], p2[1]);
      const distBtoA = getDistanceFromLatLonInM(p2[0], p2[1], p1[0], p1[1]);
      assert.equal(distAtoB, distBtoA);
    });
  });
});
