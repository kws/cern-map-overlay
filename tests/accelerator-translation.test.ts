import { describe, it, expect } from 'vitest';
import { LatLng, Polyline, Circle, Polygon, Path } from 'leaflet';
import { cernMap } from '../src/accelerators/index';

describe('Accelerator Translation', () => {
  const cernLocation = new LatLng(46.233, 6.05); // CERN
  const northCape = new LatLng(71.1725, 25.7844);
  const quito = new LatLng(-0.1807, -78.4678);
  const invercargill = new LatLng(-46.4, 168.35);

  const testLocations = [
    { name: 'CERN', latLng: cernLocation },
    { name: 'North Cape', latLng: northCape },
    { name: 'Quito', latLng: quito },
    { name: 'Invercargill', latLng: invercargill },
  ];

  // Helper to get the center of a Leaflet Path object
  const getCenterOfPath = (path: Path): LatLng => {
    if (path instanceof Circle) {
      return path.getLatLng();
    } else if (path instanceof Polygon) {
      return path.getBounds().getCenter();
    } else if (path instanceof Polyline) {
      const latLngs = path.getLatLngs();
      if (latLngs.length === 0) return new LatLng(0, 0);
      // For a polyline, we'll take the midpoint of the first and last points
      const first = latLngs[0] as LatLng;
      const last = latLngs[latLngs.length - 1] as LatLng;
      return new LatLng((first.lat + last.lat) / 2, (first.lng + last.lng) / 2);
    }
    return new LatLng(0, 0); // Fallback
  };

  testLocations.forEach((location) => {
    describe(`Translation to ${location.name}`, () => {
      Object.entries(cernMap).forEach(([acceleratorName, accelerator]) => {
        it(`should correctly translate ${acceleratorName} path center`, () => {
          const translatedPath = accelerator.getTranslatedPath(location.latLng);
          expect(translatedPath).toBeDefined();

          const pathCenter = getCenterOfPath(translatedPath);

          // Assert that the translated path's center is close to the reference point
          expect(pathCenter.lat).toBeCloseTo(location.latLng.lat, 0.01);
          expect(pathCenter.lng).toBeCloseTo(location.latLng.lng, 0.01);
        });

        it(`should correctly translate ${acceleratorName} points of interest`, () => {
          const translatedPOIs = accelerator.getTranslatedPointsOfInterest(location.latLng);
          expect(translatedPOIs).toBeDefined();

          if (translatedPOIs.length > 0) {
            let latSum = 0;
            let lngSum = 0;
            translatedPOIs.forEach((poi) => {
              const [lat, lng] = Array.isArray(poi.position)
                ? poi.position
                : [poi.position.lat, poi.position.lng];
              latSum += lat;
              lngSum += lng;
            });
            const poiCenterLat = latSum / translatedPOIs.length;
            const poiCenterLng = lngSum / translatedPOIs.length;

            // Assert that the centroid of translated POIs is close to the reference point
            expect(poiCenterLat).toBeCloseTo(location.latLng.lat, 0.01);
            expect(poiCenterLng).toBeCloseTo(location.latLng.lng, 0.01);
          }
        });
      });
    });
  });
});
