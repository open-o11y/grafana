import { MapLayerRegistryItem, MapLayerConfig, MapLayerHandler, PanelData, GrafanaTheme2 } from '@grafana/data';
import Map from 'ol/Map';
import Feature from 'ol/Feature';
import * as layer from 'ol/layer';
import * as source from 'ol/source';
import {Point} from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import decodeGeoHash from './utils'

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
  radius: 10,
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
    const vectorLayer = new layer.Heatmap({
        blur: config.blur,
        radius: config.radius,
    });

    return {
      init: () => vectorLayer,
      update: (map: Map, data: PanelData) => {
        const dataArray = decodeData(data.series[0]);
        const features:Feature[] = [];
        dataArray.locations.map((datapoint, i) => {
            const heat = new Feature({
                geometry: new Point(fromLonLat([datapoint.latitude, datapoint.longitude])),
            }); 
            features.push(heat);
        });
        for( let x=0; x<100; x+=20) {
          for( let y=0; y<40; y+=10) {
            const heat = new Feature({
              geometry: new Point(fromLonLat([x,y])),
            });
            features.push(heat);
          }
        }

        const vectorSource = new source.Vector({ features });
        vectorLayer.setSource(vectorSource);
      },
    };
  },

  // fill in the default values
  defaultOptions,
};

function decodeData(data: any) {
    const locations: any[] = [];
    const encodedGeohash = data.fields[0].values.buffer;
    const datapoints = data.fields[1].values.buffer;
    console.log("location:", encodedGeohash);
    console.log("datapoints:", datapoints);

    encodedGeohash.forEach((location: string) => {
      const decodedGeohash = decodeGeoHash(location);
      locations.push(decodedGeohash);
    });
    return {locations, datapoints};
}

