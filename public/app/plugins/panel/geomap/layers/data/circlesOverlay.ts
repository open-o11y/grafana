import { MapLayerRegistryItem, MapLayerConfig, MapLayerHandler, PanelData, GrafanaTheme2 } from '@grafana/data';
import { dataFrameToLocations } from './utils'
import { FieldMappingOptions } from '../../types'
import Map from 'ol/Map';
import Feature from 'ol/Feature';
import * as layer from 'ol/layer';
import * as source from 'ol/source';
import * as style from 'ol/style';
import {Point} from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import tinycolor from 'tinycolor2';

export interface WorldmapConfig {
  fieldMapping: FieldMappingOptions,
  minSize?: number,
  maxSize?: number,
  opacity?: number,
}

const defaultOptions: WorldmapConfig = {
  fieldMapping: {
    queryFormat: 'coordinates',
    metricField: '',
    geohashField: '',
    latitudeField: '',
    longitudeField: '',
  },
  minSize: 5,
  maxSize: 15,
  opacity: 0.3,
};

export const circlesLayer: MapLayerRegistryItem<WorldmapConfig> = {
  id: 'circles',
  name: 'Circles',
  description: 'creates circle overlays for data values',
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
        const features: Feature[] = [];

        // Get data values
        const dataArray = dataFrameToLocations(data.series[0], config);

        // Map each data value into new points
        dataArray.dataValues.map((datapoint) => {
          // Get circle colors from threshold
          const color = getColor(data.series[0].fields[0].config, theme, datapoint.value);
          var colorRBGA = tinycolor(color).toRgb();
          colorRBGA.a = config.opacity!;

          // Get circle size from user configuration
          const radius = calcCircleSize(dataArray, datapoint.value, config.minSize, config.maxSize);

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

// Scales the circle size depending on the current data and user defined configurations
function calcCircleSize(dataArray: any, value: any, minSize: any, maxSize: any) {
  const circleMinSize = minSize;
  const circleMaxSize = maxSize;

  if (dataArray.valueRange === 0) {
    return circleMaxSize;
  }

  const dataFactor = (value - dataArray.lowestValue) / dataArray.highestValue;
  const circleSizeRange = circleMaxSize - circleMinSize;
  return circleSizeRange * dataFactor + circleMinSize;
};

// Returns the color for a specific data value depending on the threshold
function getColor(config:any, theme: GrafanaTheme2, value: any ) {
  for (let index = config.thresholds.steps.length; index > 0; index -= 1) {
    if (value >= config.thresholds.steps[index - 1].value) {
      var colorName = config.thresholds.steps[index - 1].color;
      colorName = theme.visualization.getColorByName(colorName);
      return colorName;
    }
  }
};