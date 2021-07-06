import { MapLayerRegistryItem, MapLayerConfig, MapLayerHandler, PanelData, GrafanaTheme2 } from '@grafana/data';
import Map from 'ol/Map';
import Feature from 'ol/Feature';
import * as layer from 'ol/layer';
import * as source from 'ol/source';
import * as style from 'ol/style';
import {Point} from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import tinycolor from 'tinycolor2';
import decodeGeoHash from './utils';

export interface WorldmapConfig {
  minSize?: number,
  maxSize?: number,
  opacity?: number,
}

const defaultOptions: WorldmapConfig = {
  // icon: 'https://openlayers.org/en/latest/examples/data/icon.png',
  minSize: 5,
  maxSize: 10,
  opacity: 0.3,
};

export const worldmapBehaviorLayer: MapLayerRegistryItem<WorldmapConfig> = {
  id: 'circles',
  name: 'Circles',
  description: 'creates a circle marker overlay',
  isBaseMap: false,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: (map: Map, options: MapLayerConfig<WorldmapConfig>, theme: GrafanaTheme2): MapLayerHandler => {
    const config = { ...defaultOptions, ...options.config };
    const vectorLayer = new layer.Vector({});
    return {
      init: () => vectorLayer,
      update: (map: Map, data: PanelData) => {
        console.log(data);
        const features:Feature[] = [];
        const dataArray = decodeData(data.series[0]);
        dataArray.locations.map((datapoint, i) => {
          const color = getColor(data.series[0].fields[0].config, dataArray.datapoints[i], theme);
          var colorRBGA = tinycolor(color).toRgb();
          colorRBGA.a = config.opacity!;
          const radius = calcCircleSize(dataArray.datapoints[i], config.minSize, config.maxSize);
          const dot = new Feature({
              geometry: new Point(fromLonLat([datapoint.latitude, datapoint.longitude])),
          });
          dot.setStyle(new style.Style({
            image: new style.Circle({
              stroke: new style.Stroke({
                color: color,
              }),
              fill: new style.Fill({
                color: tinycolor(colorRBGA).toString(),
              }),
              radius: radius,
            })
          }));
          features.push(dot);
        });

        const vectorSource = new source.Vector({ features });
        vectorLayer.setSource(vectorSource);
      },
    };
  },

  // fill in the default values
  defaultOptions,
};


function calcCircleSize(value: any, minSize: any, maxSize: any) {
  const circleMinSize = minSize;
  const circleMaxSize = maxSize;

  // TODO: replace with this.data.valueRange from dataFormatter
  // if (this.data.valueRange === 0) {
  //   return circleMaxSize;
  // }

  // TODO: replace with this.data.minValue , maxValue from dataFormatter
  const dataFactor = (value - 1) / 4;
  const circleSizeRange = circleMaxSize - circleMinSize;
  return circleSizeRange * dataFactor + circleMinSize;
};

function getColor(config:any, value: any, theme: GrafanaTheme2) {
  for (let index = config.thresholds.steps.length; index > 0; index -= 1) {
    if (value >= config.thresholds.steps[index - 1].value) {
      var colorName = config.thresholds.steps[index - 1].color;
      colorName = theme.visualization.getColorByName(colorName);
      return colorName;
    }
  }
};

function decodeData(data: any) {
  const locations: any[] = [];
  const encodedGeohash = data.fields[0].values.buffer;
  const datapoints = data.fields[1].values.buffer;

  encodedGeohash.forEach((location: string) => {
    const decodedGeohash = decodeGeoHash(location);
    locations.push(decodedGeohash);
  });
  return {locations, datapoints};
};