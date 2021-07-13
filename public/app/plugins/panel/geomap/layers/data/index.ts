import { circlesLayer } from './circlesOverlay';
import { geojsonMapper } from './geojsonMapper';
import { heatmapLayer } from './heatMap';
import { lastPointTracker } from './lastPointTracker';

/**
 * Registry for layer handlers
 */
export const dataLayers = [
    circlesLayer,
    heatmapLayer,
    lastPointTracker,
    geojsonMapper, // dummy for now
];
