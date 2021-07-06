import { geojsonMapper } from './geojsonMapper';
import { lastPointTracker } from './lastPointTracker';
import { circlesLayer } from './circlesOverlay';

/**
 * Registry for layer handlers
 */
export const dataLayers = [
    circlesLayer, // mimic the existing worldmap
    lastPointTracker,
    geojsonMapper, // dummy for now
];
