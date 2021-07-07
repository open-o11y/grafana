import { MapLayerRegistryItem, MapLayerConfig, MapLayerHandler, PanelData, GrafanaTheme2 } from '@grafana/data';
import Map from 'ol/Map';
// import Feature from 'ol/Feature';
import * as layer from 'ol/layer';
// import {Point} from 'ol/geom';
// import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import KML from 'ol/format/KML';

export interface HeatmapConfig {
  // Amount of blur in heat map
  blur?: number;

  // Size of clusters in heat map
  radius?: number;

  // URL for a KML or GeoJSON file
  src?: string;
}

const defaultOptions: HeatmapConfig = {
  blur: 20,
  radius: 5,
  src: 'https://openlayers.org/en/latest/examples/data/kml/2012_Earthquakes_Mag5.kml',
};

export const heatmapLayer: MapLayerRegistryItem<HeatmapConfig> = {
  id: 'heatmap',
  name: 'Heatmap',
  description: 'visualizes a heatmap of the data',
  isBaseMap: false,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: (map: Map, options: MapLayerConfig<HeatmapConfig>, theme: GrafanaTheme2): MapLayerHandler => {
    const config = { ...defaultOptions, ...options.config };
    const source = new VectorSource({
        url: config.src,
        format: new KML(),
    });
    const vectorLayer = new layer.Heatmap({
        blur: config.blur,
        radius: config.radius,
        source,
    });

    return {
      init: () => vectorLayer,
      update: (map: Map, data: PanelData) => {
        // TODO
      },
    };
  },

  // fill in the default values
  defaultOptions,
};
