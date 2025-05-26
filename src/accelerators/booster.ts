import { CircularCollider } from '../types';
import { LatLng } from 'leaflet';

const LHC_RADIUS = 25; // meters

export const CENTER: LatLng = new LatLng(46.232875, 6.04718);

const BOOSTER = new CircularCollider(
  'Booster',
  CENTER,
  LHC_RADIUS,
  []
);

export default BOOSTER;