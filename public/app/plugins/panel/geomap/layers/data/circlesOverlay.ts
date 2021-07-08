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

export interface CircleConfig {
  fieldMapping: FieldMappingOptions,
  minSize: number,
  maxSize: number,
  opacity: number,
}

const defaultOptions: CircleConfig = {
  fieldMapping: {
    queryFormat: 'coordinates',
    metricField: '',
    geohashField: '',
    latitudeField: '',
    longitudeField: '',
  },
  minSize: 1,
  maxSize: 10,
  opacity: 0.4,
};

export const circlesLayer: MapLayerRegistryItem<CircleConfig> = {
  id: 'circles',
  name: 'Circles',
  description: 'creates circle overlays for data values',
  isBaseMap: false,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: (map: Map, options: MapLayerConfig<CircleConfig>, theme: GrafanaTheme2): MapLayerHandler => {
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
          // Set the opacity determined from user configuration
          colorRBGA.a = config.opacity;

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
  // Circle overlay options
  registerOptionsUI: (builder) => {
    builder
      .addNumberInput({
        path: 'minSize',
        description: 'configures the min circle size',
        name: 'Min Size',
        defaultValue: defaultOptions.minSize,
      })
      .addNumberInput({
        path: 'maxSize',
        description: 'configures the max circle size',
        name: 'Max Size',
        defaultValue: defaultOptions.maxSize,
      })
      .addSliderInput({
        path: 'opacity',
        description: 'configures the amount of transparency',
        name: 'Opacity',
        defaultValue: defaultOptions.opacity,
        settings: {
          min: 0,
          max: 1,
          step: 0.1,
        },
      })
      .addSelect({
        path: 'fieldMapping.queryFormat',
        name: 'Query Format',
        defaultValue: defaultOptions.fieldMapping.queryFormat,
        settings: {
          options: [
            {
              value: 'coordinates',
              label: 'Coordinates',
            },
            {
              value: 'geohash',
              label: 'Geohash',
            },
          ],
        },
      })
      .addTextInput({
        path: 'fieldMapping.metricField',
        name: 'Metric Field',
        defaultValue: defaultOptions.fieldMapping.metricField,
      })
      .addTextInput({
        path: 'fieldMapping.latitudeField',
        name: 'Latitude Field',
        defaultValue: defaultOptions.fieldMapping.latitudeField,
        showIf: (config) =>
          config.fieldMapping.queryFormat === 'coordinates',
      })
      .addTextInput({
        path: 'fieldMapping.longitudeField',
        name: 'Longitude Field',
        defaultValue: defaultOptions.fieldMapping.longitudeField,
        showIf: (config) =>
          config.fieldMapping.queryFormat === 'coordinates',
      })
      .addTextInput({
        path: 'fieldMapping.geohashField',
        name: 'Geohash Field',
        defaultValue: defaultOptions.fieldMapping.geohashField,
        showIf: (config) =>
          config.fieldMapping.queryFormat === 'geohash',
      });
  },
  // fill in the default values
  defaultOptions,
};

// Scales the circle size depending on the current data and user defined configurations
function calcCircleSize(dataArray: any, value: number, minSize: number, maxSize: number) {
  if (dataArray.valueRange === 0) {
    return maxSize;
  }

  const dataFactor = (value - dataArray.lowestValue) / dataArray.valueRange;
  const circleSizeRange = maxSize - minSize;
  return circleSizeRange * dataFactor + minSize;
};

// Returns the color for a specific data value depending on the threshold
function getColor(config:any, theme: GrafanaTheme2, value: number ) {
  for (let index = config.thresholds.steps.length; index > 0; index -= 1) {
    if (value >= config.thresholds.steps[index - 1].value) {
      var colorName = config.thresholds.steps[index - 1].color;
      colorName = theme.visualization.getColorByName(colorName);
      return colorName;
    }
  }
};
