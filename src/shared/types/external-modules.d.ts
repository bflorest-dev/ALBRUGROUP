declare module 'geojson' {
  export type Feature<TGeometry = unknown, TProperties = Record<string, unknown>> = {
    id?: string | number;
    type?: string;
    geometry?: TGeometry;
    properties?: TProperties;
  };

  export type FeatureCollection<TGeometry = unknown, TProperties = Record<string, unknown>> = {
    type: 'FeatureCollection';
    features: Feature<TGeometry, TProperties>[];
  };

  export type Polygon = unknown;
  export type MultiPolygon = unknown;
}

declare module 'leaflet' {
  export interface PathOptions {
    color?: string;
    weight?: number;
    opacity?: number;
    fillColor?: string;
    fillOpacity?: number;
  }

  export interface Layer {
    bindTooltip?: (content: string, options?: Record<string, unknown>) => unknown;
  }
}

declare module 'react-leaflet' {
  import type React from 'react';

  export const GeoJSON: React.ComponentType<Record<string, unknown>>;
  export const MapContainer: React.ComponentType<Record<string, unknown>>;
  export const TileLayer: React.ComponentType<Record<string, unknown>>;
}

declare module 'topojson-client' {
  export function feature(
    topology: unknown,
    object: unknown,
  ): {
    type: string;
    features?: unknown[];
  };
}

declare module 'pe-atlas/districts-100k.json' {
  const atlas: unknown;
  export default atlas;
}
