import { CircularCollider } from './util';
import { LatLng } from 'leaflet';

const RADIUS = 25; // meters

export const CENTER: LatLng = new LatLng(46.232875, 6.04718);

const PSB = new CircularCollider('PS Booster', CENTER, RADIUS, [], '#C71585');

export default PSB;
