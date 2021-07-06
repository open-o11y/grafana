import { heatmapLayer } from './heatMap';
import { geojsonMapper } from './geojsonMapper';
import { lastPointTracker } from './lastPointTracker';
import { worldmapBehaviorLayer } from './worldmapBehavior';

/**
 * Registry for layer handlers
 */
export const dataLayers = [
    worldmapBehaviorLayer, // mimic the existing worldmap
    heatmapLayer,
    lastPointTracker,
    geojsonMapper, // dummy for now
];
