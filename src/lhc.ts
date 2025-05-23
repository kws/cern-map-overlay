import { CircularCollider, PointOfInterest } from './types';
import { LatLngExpression } from 'leaflet';

// Constants
const LHC_RADIUS = 4300; // meters

// Define the LHC detectors as points of interest
const LHC_POINTS: PointOfInterest[] = [
  {
    name: 'ATLAS',
    position: [46.23497502511518, 6.0536309870679235],
  },
  {
    name: 'Point 2',
    position: [46.251544268663615, 6.021434048433471],
  },
  {
    name: 'Point 3',
    position: [46.277518302316, 6.012012123858463],
  },
  {
    name: 'Point 4',
    position: [46.30445011831323, 6.037082600001055],
  },
  {
    name: 'CMS',
    position: [46.31026650910126, 6.078887140749957],
  },
  {
    name: 'Point 6',
    position: [46.29351162288481, 6.111756560082773],
  },
  {
    name: 'Point 7',
    position: [46.266418692548335, 6.115151115340182],
  },
  {
    name: 'Point 8',
    position: [46.2417904558472, 6.097942093891781],
  }
];

export const CENTER: LatLngExpression = LHC_POINTS.reduce<[number, number]>(
  (acc, point) => {
    const pos = point.position as [number, number];
    return [
      acc[0] + pos[0],
      acc[1] + pos[1]
    ];
  },
  [0, 0]
).map(coord => coord / LHC_POINTS.length) as [number, number];

// Create the LHC accelerator instance
const lhc = new CircularCollider(
  'Large Hadron Collider',
  CENTER,
  LHC_RADIUS,
  LHC_POINTS
);

export default lhc;