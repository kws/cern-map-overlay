import { LinearAccelerator } from './util';
import { LatLng } from 'leaflet';

const START: LatLng = new LatLng(46.23121030223552, 6.046594519834996);
const LENGTH = 78; // meters
const DIRECTION = -12; // degrees

const LINAC4 = new LinearAccelerator('LINAC4', START, LENGTH, DIRECTION, [], '#FF0000');

export default LINAC4;
