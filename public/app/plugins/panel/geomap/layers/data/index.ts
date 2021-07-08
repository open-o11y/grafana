import { geojsonMapper } from './geojsonMapper';
import { lastPointTracker } from './lastPointTracker';
import { worldmapBehaviorLayer } from './worldmapBehavior';
import { heatmapLayer } from './heatMap';

/**
 * Registry for layer handlers
 */
export const dataLayers = [
    heatmapLayer,
    worldmapBehaviorLayer, // mimic the existing worldmap
    lastPointTracker,
    geojsonMapper, // dummy for now
];
