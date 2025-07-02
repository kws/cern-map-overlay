import { LinearAccelerator } from './util';
import { LatLng } from 'leaflet';

/**
 * These are just guestimates as I don't have the exact coordinates or the exact length.
 */

const START: LatLng = new LatLng(46.23163551273157, 6.046979545777202);
const LENGTH = 10; // meters
const DIRECTION = 20; // degrees

const LINAC3 = new LinearAccelerator('LINAC3', START, LENGTH, DIRECTION, [], '#C71585');

export default LINAC3;
