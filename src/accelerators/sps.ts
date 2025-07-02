import { LatLng } from 'leaflet';
import { CircularCollider } from './util';

const RADIUS = 1100; // meters

export const CENTER: LatLng = new LatLng(46.2447, 6.056);

const SPS = new CircularCollider('Super Proton Synchrotron', CENTER, RADIUS, [], '#FFA500');

export default SPS;
