import {
  FrameGeometrySource,
  FrameGeometrySourceMode,
  FieldMatcher,
  getFieldMatcher,
  FieldMatcherID,
  DataFrame,
  Field,
  getFieldDisplayName,
  LookupSourceOptions,
  LookupSourceFiles,
  LookupSource,
} from '@grafana/data';
import { Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { decodeGeohash } from './geohash';

export type FieldFinder = (frame: DataFrame) => Field | undefined;

function getFieldFinder(matcher: FieldMatcher): FieldFinder {
  return (frame: DataFrame) => {
    for (const field of frame.fields) {
      if (matcher(field, frame, [])) {
        return field;
      }
    }
    return undefined;
  };
}

function matchLowerNames(names: Set<string>): FieldFinder {
  return (frame: DataFrame) => {
    for (const field of frame.fields) {
      if (names.has(field.name.toLowerCase())) {
        return field;
      }
      const disp = getFieldDisplayName(field, frame);
      if (names.has(disp)) {
        return field;
      }
    }
    return undefined;
  };
}

export interface LocationFieldMatchers {
  mode: FrameGeometrySourceMode;

  // Field mappings
  geohash: FieldFinder;
  latitude: FieldFinder;
  longitude: FieldFinder;
  h3: FieldFinder;
  wkt: FieldFinder;
  lookup: FieldFinder;

  // Field mapping parameters
  lookupSrc: LookupSource;
}

const defaultLookupSource: LookupSource = {
  mode: LookupSourceOptions.File,
  lookupSrcPath: LookupSourceFiles.Countries,
};

const defaultMatchers: LocationFieldMatchers = {
  mode: FrameGeometrySourceMode.Auto,
  geohash: matchLowerNames(new Set(['geohash'])),
  latitude: matchLowerNames(new Set(['latitude', 'lat'])),
  longitude: matchLowerNames(new Set(['longitude', 'lon', 'lng'])),
  h3: matchLowerNames(new Set(['h3'])),
  wkt: matchLowerNames(new Set(['wkt'])),
  lookup: matchLowerNames(new Set(['lookup', 'target'])),
  lookupSrc: defaultLookupSource,
};

export function getLocationMatchers(src?: FrameGeometrySource): LocationFieldMatchers {
  const info: LocationFieldMatchers = {
    ...defaultMatchers,
    mode: src?.mode ?? FrameGeometrySourceMode.Auto,
  };
  switch (info.mode) {
    case FrameGeometrySourceMode.Coords:
      if (src?.latitude) {
        info.latitude = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.latitude }));
      }
      if (src?.longitude) {
        info.longitude = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.longitude }));
      }
      break;
    case FrameGeometrySourceMode.Geohash:
      if (src?.geohash) {
        info.geohash = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.geohash }));
      }
      break;
    case FrameGeometrySourceMode.Lookup:
      if (src?.lookup) {
        info.lookup = getFieldFinder(getFieldMatcher({ id: FieldMatcherID.byName, options: src.lookup }));
      }
      // Lookup Source is file data
      if (src?.lookupSrcMode === LookupSourceOptions.File) {
        if (src?.lookupSrcPath) {
          info.lookupSrc = {
            mode: src.lookupSrcMode,
            lookupSrcPath: src.lookupSrcPath,
          };
        } else {
          throw new Error('Json endpoint not defined');
        }
      }
      // Lookup Source is a json endpoint
      else if (src?.lookupSrcMode === LookupSourceOptions.JSON) {
        if (src?.lookupSrcJson) {
          info.lookupSrc = {
            mode: src.lookupSrcMode,
            lookupSrcJson: src.lookupSrcJson,
          };
        } else {
          throw new Error('Json endpoint not defined');
        }
      }
      // Lookup Source is a jsonp endpoint
      else if (src?.lookupSrcMode === LookupSourceOptions.JSONP) {
        if (src?.lookupSrcJsonp && src?.lookupSrcCallback) {
          info.lookupSrc = {
            mode: src.lookupSrcMode,
            lookupSrcJsonp: src.lookupSrcJsonp,
            lookupSrcCallback: src.lookupSrcCallback,
          };
        } else {
          throw new Error('Jsonp endpoint not defined');
        }
      }
      break;
  }
  return info;
}
export interface LocationFields {
  mode: FrameGeometrySourceMode;

  // Field mappings
  geohash?: Field;
  latitude?: Field;
  longitude?: Field;
  h3?: Field;
  wkt?: Field;
  lookup?: Field;
}

export function getLocationFields(frame: DataFrame, location: LocationFieldMatchers): LocationFields {
  const fields: LocationFields = {
    mode: location.mode ?? FrameGeometrySourceMode.Auto,
  };

  // Find the best option
  if (fields.mode === FrameGeometrySourceMode.Auto) {
    fields.latitude = location.latitude(frame);
    fields.longitude = location.longitude(frame);
    if (fields.latitude && fields.longitude) {
      fields.mode = FrameGeometrySourceMode.Coords;
      return fields;
    }
    fields.geohash = location.geohash(frame);
    if (fields.geohash) {
      fields.mode = FrameGeometrySourceMode.Geohash;
      return fields;
    }
    fields.lookup = location.lookup(frame);
    if (fields.lookup) {
      fields.mode = FrameGeometrySourceMode.Lookup;
      return fields;
    }
  }

  switch (fields.mode) {
    case FrameGeometrySourceMode.Coords:
      fields.latitude = location.latitude(frame);
      fields.longitude = location.longitude(frame);
      break;
    case FrameGeometrySourceMode.Geohash:
      fields.geohash = location.geohash(frame);
      break;
    case FrameGeometrySourceMode.Lookup:
      fields.lookup = location.lookup(frame);
      break;
  }

  return fields;
}

function getLocationJson(lookupSrc: LookupSource): any {
  // built-in file
  if (lookupSrc.mode === LookupSourceOptions.File) {
    if (lookupSrc.lookupSrcPath) {
      return require('./keyMapping/' + lookupSrc.lookupSrcPath + '.json');
    }
  }
  // json endpoint
  else if (lookupSrc.mode === LookupSourceOptions.JSON) {
    if (lookupSrc.lookupSrcJson) {
      console.log('json');
    }
  }
  // jsonp endpoint
  else {
    if (lookupSrc.lookupSrcJsonp && lookupSrc.lookupSrcCallback) {
      console.log('jsonp');
    }
  }
}

export interface LocationInfo {
  warning?: string;
  points: Point[];
}

export function dataFrameToPoints(frame: DataFrame, location: LocationFieldMatchers): LocationInfo {
  const info: LocationInfo = {
    points: [],
  };
  if (!frame?.length) {
    return info;
  }
  const fields = getLocationFields(frame, location);
  switch (fields.mode) {
    case FrameGeometrySourceMode.Coords:
      if (fields.latitude && fields.longitude) {
        info.points = getPointsFromLonLat(fields.longitude, fields.latitude);
      } else {
        info.warning = 'Missing latitude/longitude fields';
      }
      break;

    case FrameGeometrySourceMode.Geohash:
      if (fields.geohash) {
        info.points = getPointsFromGeohash(fields.geohash);
      } else {
        info.warning = 'Missing geohash field';
      }
      break;

    case FrameGeometrySourceMode.Lookup:
      if (fields.lookup && location.lookupSrc) {
        const locationData = getLocationJson(location.lookupSrc);
        info.points = getPointsFromLookup(fields.lookup, locationData);
      } else {
        info.warning = 'Missing lookup/lookupSrc field';
      }
      break;

    case FrameGeometrySourceMode.Auto:
      info.warning = 'Unable to find location fields';
  }

  return info;
}

function getPointsFromLonLat(lon: Field<number>, lat: Field<number>): Point[] {
  const count = lat.values.length;
  const points = new Array<Point>(count);
  for (let i = 0; i < count; i++) {
    points[i] = new Point(fromLonLat([lon.values.get(i), lat.values.get(i)]));
  }
  return points;
}

function getPointsFromGeohash(field: Field<string>): Point[] {
  const count = field.values.length;
  const points = new Array<Point>(count);
  for (let i = 0; i < count; i++) {
    const coords = decodeGeohash(field.values.get(i));
    if (coords) {
      points[i] = new Point(fromLonLat(coords));
    }
  }
  return points;
}

function getPointsFromLookup(field: Field<string>, locationData: any): Point[] {
  const count = field.values.length;
  const points = new Array<Point>(count);
  for (let i = 0; i < count; i++) {
    const target = field.values.get(i);
    const location = locationData.filter((loc: any) => loc.key.toUpperCase() === target.toUpperCase())[0];
    if (location) {
      points[i] = new Point(fromLonLat([location.longitude, location.latitude]));
    }
  }
  return points;
}
