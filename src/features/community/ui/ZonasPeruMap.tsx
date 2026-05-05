import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { Layer, PathOptions } from 'leaflet';
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet';
import * as topojson from 'topojson-client';
import atlasLocal from 'pe-atlas/districts-100k.json';
import { LeadsRepository } from '@shared/api/repositories/leads.repository';
import type { ZonaReglaResponse, ZonaResponse } from '@shared/types';
import type { DepartamentoResponse, ProvinciaResponse } from '@shared/types';
import 'leaflet/dist/leaflet.css';

type AtlasGeometry = Polygon | MultiPolygon;
type AtlasFeature = Feature<AtlasGeometry, { name?: string }>;
type AtlasFeatureCollection = FeatureCollection<AtlasGeometry, { name?: string }>;

type RuleLevel = 'DEPARTAMENTO' | 'PROVINCIA' | 'DISTRITO';
type RuleCriteria = 'INCLUIR' | 'EXCLUIR';

interface AtlasObjects {
  districts: object;
  provinces: object;
  departments: object;
}

interface PeruAtlasTopology {
  type: 'Topology';
  objects: AtlasObjects;
}

interface AtlasIndex {
  departmentCodesByName: Map<string, Set<string>>;
  provinceCodesByName: Map<string, Set<string>>;
  districtCodesByName: Map<string, Set<string>>;
  districtsByDepartment: Map<string, Set<string>>;
  districtsByProvince: Map<string, Set<string>>;
}

interface CoverageResult {
  includedDistrictCodes: Set<string>;
  includedRules: number;
  excludedRules: number;
  unresolvedRules: number;
}

interface GeoCodeLookup {
  departmentCodeByGeoId: Record<number, string>;
  provinceCodeByGeoId: Record<number, string>;
  districtCodeByGeoId: Record<number, string>;
}

interface ZonasPeruMapProps {
  zonas: ZonaResponse[];
}

const PE_ATLAS_CDN_URL = 'https://unpkg.com/pe-atlas@0.0.1/districts-100k.json';
const DEFAULT_CENTER: [number, number] = [-9.19, -75.0152];
const DEFAULT_ZOOM = 5;

const EMPTY_GEO_CODE_LOOKUP: GeoCodeLookup = {
  departmentCodeByGeoId: {},
  provinceCodeByGeoId: {},
  districtCodeByGeoId: {},
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isPeruAtlasTopology = (value: unknown): value is PeruAtlasTopology => {
  if (!isObjectRecord(value)) {
    return false;
  }

  if (value.type !== 'Topology') {
    return false;
  }

  if (!isObjectRecord(value.objects)) {
    return false;
  }

  return (
    Object.prototype.hasOwnProperty.call(value.objects, 'districts')
    && Object.prototype.hasOwnProperty.call(value.objects, 'provinces')
    && Object.prototype.hasOwnProperty.call(value.objects, 'departments')
  );
};

const normalizeText = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeLevel = (value: string): RuleLevel | null => {
  const normalized = normalizeText(value);

  if (normalized === 'DEPARTAMENTO' || normalized === 'PROVINCIA' || normalized === 'DISTRITO') {
    return normalized;
  }

  return null;
};

const normalizeCriteria = (value: string): RuleCriteria | null => {
  const normalized = normalizeText(value);

  if (normalized === 'INCLUIR' || normalized === 'EXCLUIR') {
    return normalized;
  }

  return null;
};

const toTitleCase = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/(^|\s|\-)([a-z])/g, (_, sep: string, letter: string) => `${sep}${letter.toUpperCase()}`);
};

const addToGroupedSet = (groupedMap: Map<string, Set<string>>, key: string, value: string): void => {
  const existing = groupedMap.get(key);
  if (existing) {
    existing.add(value);
    return;
  }

  groupedMap.set(key, new Set([value]));
};

const getFeatureCode = (
  feature: Feature | undefined,
  expectedLength: 2 | 4 | 6,
): string | null => {
  if (!feature) {
    return null;
  }

  const rawId = feature.id;
  if (typeof rawId === 'string') {
    const digitsOnly = rawId.replace(/\D/g, '');
    if (!digitsOnly) {
      return null;
    }
    return digitsOnly.padStart(expectedLength, '0').slice(0, expectedLength);
  }

  if (typeof rawId === 'number' && Number.isFinite(rawId)) {
    return String(Math.trunc(rawId)).padStart(expectedLength, '0').slice(0, expectedLength);
  }

  return null;
};

const getFeatureName = (feature: Feature | undefined): string | null => {
  if (!feature || !feature.properties || !isObjectRecord(feature.properties)) {
    return null;
  }

  const maybeName = feature.properties.name;
  if (typeof maybeName !== 'string') {
    return null;
  }

  const trimmedName = maybeName.trim();
  return trimmedName.length > 0 ? trimmedName : null;
};

const toFeatureCollection = (value: ReturnType<typeof topojson.feature>): AtlasFeatureCollection | null => {
  if (value.type !== 'FeatureCollection') {
    return null;
  }

  return value as AtlasFeatureCollection;
};

const buildAtlasIndex = (
  districts: AtlasFeatureCollection,
  provinces: AtlasFeatureCollection,
  departments: AtlasFeatureCollection,
): AtlasIndex => {
  const departmentCodesByName = new Map<string, Set<string>>();
  const provinceCodesByName = new Map<string, Set<string>>();
  const districtCodesByName = new Map<string, Set<string>>();
  const districtsByDepartment = new Map<string, Set<string>>();
  const districtsByProvince = new Map<string, Set<string>>();

  for (const feature of departments.features) {
    const code = getFeatureCode(feature, 2);
    const name = getFeatureName(feature);

    if (!code || !name) {
      continue;
    }

    addToGroupedSet(departmentCodesByName, normalizeText(name), code);
  }

  for (const feature of provinces.features) {
    const code = getFeatureCode(feature, 4);
    const name = getFeatureName(feature);

    if (!code || !name) {
      continue;
    }

    addToGroupedSet(provinceCodesByName, normalizeText(name), code);
  }

  for (const feature of districts.features) {
    const code = getFeatureCode(feature, 6);
    const name = getFeatureName(feature);

    if (!code) {
      continue;
    }

    const departmentCode = code.slice(0, 2);
    const provinceCode = code.slice(0, 4);

    addToGroupedSet(districtsByDepartment, departmentCode, code);
    addToGroupedSet(districtsByProvince, provinceCode, code);

    if (name) {
      addToGroupedSet(districtCodesByName, normalizeText(name), code);
    }
  }

  return {
    departmentCodesByName,
    provinceCodesByName,
    districtCodesByName,
    districtsByDepartment,
    districtsByProvince,
  };
};

const getRuleName = (rule: ZonaReglaResponse): string | null => {
  if (!isObjectRecord(rule)) {
    return null;
  }

  const maybeName = (rule as Record<string, unknown>).nombre;
  if (typeof maybeName !== 'string') {
    return null;
  }

  const trimmed = maybeName.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getRuleGeoCode = (
  rule: ZonaReglaResponse,
  level: RuleLevel,
  geoCodeLookup: GeoCodeLookup,
): string | null => {
  const rawGeoId = rule.geoId;

  if (typeof rawGeoId !== 'number' || !Number.isFinite(rawGeoId)) {
    return null;
  }

  const geoId = Math.trunc(rawGeoId);

  if (level === 'DEPARTAMENTO') {
    const mappedCode = geoCodeLookup.departmentCodeByGeoId[geoId];
    if (mappedCode) {
      return mappedCode;
    }
  }

  if (level === 'PROVINCIA') {
    const mappedCode = geoCodeLookup.provinceCodeByGeoId[geoId];
    if (mappedCode) {
      return mappedCode;
    }
  }

  if (level === 'DISTRITO') {
    const mappedCode = geoCodeLookup.districtCodeByGeoId[geoId];
    if (mappedCode) {
      return mappedCode;
    }
  }

  const digitsOnly = String(Math.trunc(rawGeoId)).replace(/\D/g, '');
  if (!digitsOnly) {
    return null;
  }

  if (level === 'DEPARTAMENTO') {
    return digitsOnly.padStart(2, '0').slice(0, 2);
  }

  if (level === 'PROVINCIA') {
    return digitsOnly.padStart(4, '0').slice(0, 4);
  }

  return digitsOnly.padStart(6, '0').slice(0, 6);
};

const collectCodesFromName = (
  indexMap: Map<string, Set<string>>,
  name: string | null,
): Set<string> => {
  if (!name) {
    return new Set<string>();
  }

  const normalizedName = normalizeText(name);
  const found = indexMap.get(normalizedName);
  return found ? new Set(found) : new Set<string>();
};

const expandDistricts = (
  sourceCodes: Set<string>,
  districtsLookup: Map<string, Set<string>>,
  target: Set<string>,
): void => {
  for (const code of sourceCodes) {
    const districtCodes = districtsLookup.get(code);
    if (!districtCodes) {
      continue;
    }

    for (const districtCode of districtCodes) {
      target.add(districtCode);
    }
  }
};

const computeCoverage = (
  rules: ZonaReglaResponse[],
  atlasIndex: AtlasIndex,
  geoCodeLookup: GeoCodeLookup,
): CoverageResult => {
  const includedDepartments = new Set<string>();
  const includedProvinces = new Set<string>();
  const includedDistrictsDirect = new Set<string>();

  const excludedDepartments = new Set<string>();
  const excludedProvinces = new Set<string>();
  const excludedDistrictsDirect = new Set<string>();

  let includedRules = 0;
  let excludedRules = 0;
  let unresolvedRules = 0;

  for (const rule of rules) {
    const level = normalizeLevel(rule.nivelGeografico);
    const criteria = normalizeCriteria(rule.criterio);

    if (!level || !criteria) {
      unresolvedRules += 1;
      continue;
    }

    const ruleName = getRuleName(rule);

    const departmentCodes = level === 'DEPARTAMENTO'
      ? collectCodesFromName(atlasIndex.departmentCodesByName, ruleName)
      : new Set<string>();

    const provinceCodes = level === 'PROVINCIA'
      ? collectCodesFromName(atlasIndex.provinceCodesByName, ruleName)
      : new Set<string>();

    const districtCodes = level === 'DISTRITO'
      ? collectCodesFromName(atlasIndex.districtCodesByName, ruleName)
      : new Set<string>();

    const geoCode = getRuleGeoCode(rule, level, geoCodeLookup);
    if (geoCode) {
      if (level === 'DEPARTAMENTO') {
        departmentCodes.add(geoCode);
      } else if (level === 'PROVINCIA') {
        provinceCodes.add(geoCode);
      } else {
        districtCodes.add(geoCode);
      }
    }

    const matchedAnyCode = departmentCodes.size > 0 || provinceCodes.size > 0 || districtCodes.size > 0;

    const [departmentTarget, provinceTarget, districtTarget] = criteria === 'INCLUIR'
      ? [includedDepartments, includedProvinces, includedDistrictsDirect]
      : [excludedDepartments, excludedProvinces, excludedDistrictsDirect];

    for (const code of departmentCodes) {
      departmentTarget.add(code);
    }

    for (const code of provinceCodes) {
      provinceTarget.add(code);
    }

    for (const code of districtCodes) {
      districtTarget.add(code);
    }

    if (criteria === 'INCLUIR') {
      includedRules += 1;
    } else {
      excludedRules += 1;
    }

    if (!matchedAnyCode) {
      unresolvedRules += 1;
    }
  }

  const includedDistrictCodes = new Set<string>();
  const excludedDistrictCodes = new Set<string>();

  expandDistricts(includedDepartments, atlasIndex.districtsByDepartment, includedDistrictCodes);
  expandDistricts(includedProvinces, atlasIndex.districtsByProvince, includedDistrictCodes);
  for (const districtCode of includedDistrictsDirect) {
    includedDistrictCodes.add(districtCode);
  }

  expandDistricts(excludedDepartments, atlasIndex.districtsByDepartment, excludedDistrictCodes);
  expandDistricts(excludedProvinces, atlasIndex.districtsByProvince, excludedDistrictCodes);
  for (const districtCode of excludedDistrictsDirect) {
    excludedDistrictCodes.add(districtCode);
  }

  for (const districtCode of excludedDistrictCodes) {
    includedDistrictCodes.delete(districtCode);
  }

  return {
    includedDistrictCodes,
    includedRules,
    excludedRules,
    unresolvedRules,
  };
};

const getDistrictStyle = (
  feature: Feature | undefined,
  includedDistrictCodes: Set<string>,
): PathOptions => {
  const districtCode = getFeatureCode(feature, 6);
  const included = districtCode ? includedDistrictCodes.has(districtCode) : false;

  return {
    color: included ? '#0a4db2' : '#8a97ab',
    weight: included ? 0.9 : 0.5,
    fillColor: included ? '#0f6bff' : '#d8dee9',
    fillOpacity: included ? 0.52 : 0.1,
  };
};

const provinceStyle: PathOptions = {
  color: '#5e6f89',
  weight: 1,
  opacity: 0.5,
  fillOpacity: 0,
};

const departmentStyle: PathOptions = {
  color: '#31415e',
  weight: 1.5,
  opacity: 0.7,
  fillOpacity: 0,
};

export const ZonasPeruMap: React.FC<ZonasPeruMapProps> = ({ zonas }) => {
  const [atlasTopology, setAtlasTopology] = useState<PeruAtlasTopology | null>(() => {
    return isPeruAtlasTopology(atlasLocal) ? atlasLocal : null;
  });
  const [atlasError, setAtlasError] = useState('');
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null);
  const [geoCodeLookup, setGeoCodeLookup] = useState<GeoCodeLookup>(EMPTY_GEO_CODE_LOOKUP);
  const [geoCodeLoading, setGeoCodeLoading] = useState(false);

  const departmentsCacheRef = useRef<DepartamentoResponse[] | null>(null);
  const provincesCacheRef = useRef<ProvinciaResponse[] | null>(null);
  const districtsByProvinceCacheRef = useRef<Record<number, Array<{ id: number; codigo: string }>>>({});
  const districtCodeByGeoIdCacheRef = useRef<Record<number, string>>({});

  const zonasSorted = useMemo(() => {
    return [...zonas].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  }, [zonas]);

  useEffect(() => {
    setSelectedZonaId((prev) => {
      if (zonasSorted.length === 0) {
        return null;
      }

      if (prev !== null && zonasSorted.some((zona) => zona.id === prev)) {
        return prev;
      }

      const activeZona = zonasSorted.find((zona) => zona.activo);
      const fallbackZona = activeZona ?? zonasSorted[0];
      return fallbackZona ? fallbackZona.id : null;
    });
  }, [zonasSorted]);

  useEffect(() => {
    if (atlasTopology) {
      return;
    }

    let cancelled = false;

    const loadFromCdn = async () => {
      try {
        setAtlasError('');
        const response = await fetch(PE_ATLAS_CDN_URL);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload: unknown = await response.json();
        if (!isPeruAtlasTopology(payload)) {
          throw new Error('Formato TopoJSON inválido');
        }

        if (!cancelled) {
          setAtlasTopology(payload);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'No se pudo cargar el atlas de Perú';
          setAtlasError(message);
        }
      }
    };

    void loadFromCdn();

    return () => {
      cancelled = true;
    };
  }, [atlasTopology]);

  const atlasLayers = useMemo(() => {
    if (!atlasTopology) {
      return null;
    }

    const districts = toFeatureCollection(
      topojson.feature(
        atlasTopology as unknown as Parameters<typeof topojson.feature>[0],
        atlasTopology.objects.districts as Parameters<typeof topojson.feature>[1],
      ),
    );

    const provinces = toFeatureCollection(
      topojson.feature(
        atlasTopology as unknown as Parameters<typeof topojson.feature>[0],
        atlasTopology.objects.provinces as Parameters<typeof topojson.feature>[1],
      ),
    );

    const departments = toFeatureCollection(
      topojson.feature(
        atlasTopology as unknown as Parameters<typeof topojson.feature>[0],
        atlasTopology.objects.departments as Parameters<typeof topojson.feature>[1],
      ),
    );

    if (!districts || !provinces || !departments) {
      return null;
    }

    return {
      districts,
      provinces,
      departments,
    };
  }, [atlasTopology]);

  const selectedZona = useMemo(() => {
    if (selectedZonaId === null) {
      return null;
    }

    return zonasSorted.find((zona) => zona.id === selectedZonaId) ?? null;
  }, [selectedZonaId, zonasSorted]);

  useEffect(() => {
    if (!selectedZona || selectedZona.reglas.length === 0) {
      setGeoCodeLookup(EMPTY_GEO_CODE_LOOKUP);
      return;
    }

    let cancelled = false;

    const buildGeoCodeLookup = async () => {
      setGeoCodeLoading(true);

      try {
        const requiredDepartmentIds = new Set<number>();
        const requiredProvinceIds = new Set<number>();
        const requiredDistrictIds = new Set<number>();

        for (const rule of selectedZona.reglas) {
          const level = normalizeLevel(rule.nivelGeografico);
          const geoId = typeof rule.geoId === 'number' && Number.isFinite(rule.geoId)
            ? Math.trunc(rule.geoId)
            : null;

          if (!level || geoId === null) {
            continue;
          }

          if (level === 'DEPARTAMENTO') {
            requiredDepartmentIds.add(geoId);
          } else if (level === 'PROVINCIA') {
            requiredProvinceIds.add(geoId);
          } else {
            requiredDistrictIds.add(geoId);
          }
        }

        if (
          requiredDepartmentIds.size === 0
          && requiredProvinceIds.size === 0
          && requiredDistrictIds.size === 0
        ) {
          if (!cancelled) {
            setGeoCodeLookup(EMPTY_GEO_CODE_LOOKUP);
          }
          return;
        }

        const departments = departmentsCacheRef.current
          ?? await LeadsRepository.getDepartamentos();
        departmentsCacheRef.current = departments;

        const departmentCodeByGeoId: Record<number, string> = {};
        for (const department of departments) {
          if (requiredDepartmentIds.has(department.id)) {
            departmentCodeByGeoId[department.id] = department.codigo;
          }
        }

        let allProvinces: ProvinciaResponse[] = [];
        if (requiredProvinceIds.size > 0 || requiredDistrictIds.size > 0) {
          allProvinces = provincesCacheRef.current ?? [];

          if (allProvinces.length === 0) {
            const provincesByDepartment = await Promise.all(
              departments.map(async (department: DepartamentoResponse) => {
                try {
                  return await LeadsRepository.getProvinciasPorDepartamento(department.id);
                } catch {
                  return [];
                }
              }),
            );

            allProvinces = provincesByDepartment.flat();
            provincesCacheRef.current = allProvinces;
          }
        }

        const provinceCodeByGeoId: Record<number, string> = {};
        if (requiredProvinceIds.size > 0) {
          for (const province of allProvinces) {
            if (requiredProvinceIds.has(province.id)) {
              provinceCodeByGeoId[province.id] = province.codigo;
            }
          }
        }

        const districtCodeByGeoId: Record<number, string> = {};
        if (requiredDistrictIds.size > 0 && allProvinces.length > 0) {
          Object.assign(districtCodeByGeoId, districtCodeByGeoIdCacheRef.current);

          const unresolvedDistrictIds = new Set<number>(
            [...requiredDistrictIds].filter((districtId) => !districtCodeByGeoId[districtId]),
          );

          for (const province of allProvinces) {
            if (unresolvedDistrictIds.size === 0) {
              break;
            }

            let districts: Array<{ id: number; codigo: string }> = [];
            const cachedDistricts = districtsByProvinceCacheRef.current[province.id];
            if (cachedDistricts) {
              districts = cachedDistricts;
            } else {
              try {
                districts = await LeadsRepository.getDistritosPorProvincia(province.id);
                districtsByProvinceCacheRef.current[province.id] = districts;
              } catch {
                continue;
              }
            }

            for (const district of districts) {
              if (unresolvedDistrictIds.has(district.id)) {
                districtCodeByGeoId[district.id] = district.codigo;
                unresolvedDistrictIds.delete(district.id);
              }
            }
          }

          Object.assign(districtCodeByGeoIdCacheRef.current, districtCodeByGeoId);
        }

        if (!cancelled) {
          setGeoCodeLookup({
            departmentCodeByGeoId,
            provinceCodeByGeoId,
            districtCodeByGeoId,
          });
        }
      } finally {
        if (!cancelled) {
          setGeoCodeLoading(false);
        }
      }
    };

    void buildGeoCodeLookup();

    return () => {
      cancelled = true;
    };
  }, [selectedZona]);

  const atlasIndex = useMemo(() => {
    if (!atlasLayers) {
      return null;
    }

    return buildAtlasIndex(atlasLayers.districts, atlasLayers.provinces, atlasLayers.departments);
  }, [atlasLayers]);

  const coverage = useMemo(() => {
    if (!atlasIndex || !selectedZona) {
      return {
        includedDistrictCodes: new Set<string>(),
        includedRules: 0,
        excludedRules: 0,
        unresolvedRules: 0,
      } satisfies CoverageResult;
    }

    return computeCoverage(selectedZona.reglas, atlasIndex, geoCodeLookup);
  }, [atlasIndex, selectedZona, geoCodeLookup]);

  const handleDistrictTooltip = useCallback((feature: Feature | undefined, layer: Layer) => {
    const name = getFeatureName(feature);
    if (!name || typeof layer.bindTooltip !== 'function') {
      return;
    }

    layer.bindTooltip(`Distrito: ${toTitleCase(name)}`, {
      sticky: true,
      direction: 'top',
      opacity: 0.95,
    });
  }, []);

  const handleProvinceTooltip = useCallback((feature: Feature | undefined, layer: Layer) => {
    const name = getFeatureName(feature);
    if (!name || typeof layer.bindTooltip !== 'function') {
      return;
    }

    layer.bindTooltip(`Provincia: ${toTitleCase(name)}`, {
      sticky: true,
      direction: 'top',
      opacity: 0.95,
    });
  }, []);

  const handleDepartmentTooltip = useCallback((feature: Feature | undefined, layer: Layer) => {
    const name = getFeatureName(feature);
    if (!name || typeof layer.bindTooltip !== 'function') {
      return;
    }

    layer.bindTooltip(`Departamento: ${toTitleCase(name)}`, {
      sticky: true,
      direction: 'top',
      opacity: 0.95,
    });
  }, []);

  const districtStyle = useCallback(
    (feature: Feature | undefined): PathOptions => {
      return getDistrictStyle(feature, coverage.includedDistrictCodes);
    },
    [coverage.includedDistrictCodes],
  );

  if (zonasSorted.length === 0) {
    return (
      <div className="community-state">
        No hay zonas disponibles para visualizar en el mapa.
      </div>
    );
  }

  if (!atlasLayers) {
    if (atlasError) {
      return (
        <div className="community-state is-error">
          No se pudo cargar el mapa de Perú: {atlasError}
        </div>
      );
    }

    return (
      <div className="community-state">
        Cargando mapa de Perú...
      </div>
    );
  }

  return (
    <div className="community-zonas-map-panel">
      <div className="community-zonas-map-toolbar">
        <div className="community-field community-zonas-map-field">
          <label htmlFor="community-zona-map-select">Zona a visualizar</label>
          <select
            id="community-zona-map-select"
            className="community-select"
            value={selectedZonaId ?? ''}
            onChange={(event) => {
              const nextId = Number(event.target.value);
              setSelectedZonaId(Number.isFinite(nextId) ? nextId : null);
            }}
          >
            {zonasSorted.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.nombre} {zona.activo ? '(activa)' : '(inactiva)'}
              </option>
            ))}
          </select>
        </div>

        <div className="community-zonas-map-stats" aria-live="polite">
          <strong>{coverage.includedDistrictCodes.size}</strong> distritos cubiertos
          <span>
            {coverage.includedRules} reglas incluir, {coverage.excludedRules} reglas excluir
          </span>
          {geoCodeLoading && (
            <span className="community-zonas-map-warning">
              Resolviendo códigos geográficos de reglas...
            </span>
          )}
          {coverage.unresolvedRules > 0 && (
            <span className="community-zonas-map-warning">
              {coverage.unresolvedRules} regla(s) sin coincidencia exacta de nombre/código
            </span>
          )}
        </div>
      </div>

      <div className="community-zonas-map-wrapper">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={4}
          maxZoom={11}
          className="community-zonas-map"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <GeoJSON
            key={`districts-${selectedZona?.id ?? 'none'}`}
            data={atlasLayers.districts}
            style={districtStyle}
            onEachFeature={handleDistrictTooltip}
          />

          <GeoJSON
            key="provinces-overlay"
            data={atlasLayers.provinces}
            style={() => provinceStyle}
            onEachFeature={handleProvinceTooltip}
          />

          <GeoJSON
            key="departments-overlay"
            data={atlasLayers.departments}
            style={() => departmentStyle}
            onEachFeature={handleDepartmentTooltip}
          />
        </MapContainer>
      </div>

      <div className="community-zonas-map-legend" aria-label="Leyenda de sombreado">
        <span className="community-zonas-map-legend-item">
          <span className="community-zonas-map-swatch is-included" />
          Zona incluida por reglas finales
        </span>
        <span className="community-zonas-map-legend-item">
          <span className="community-zonas-map-swatch is-not-included" />
          Zona no incluida (opacidad baja)
        </span>
        <span className="community-zonas-map-legend-item">
          <span className="community-zonas-map-line is-province" />
          Límite provincial
        </span>
        <span className="community-zonas-map-legend-item">
          <span className="community-zonas-map-line is-department" />
          Límite departamental
        </span>
      </div>

      <p className="community-zonas-map-help">
        Regla aplicada: inclusión por departamento/provincia/distrito con prioridad de exclusiones.
      </p>
    </div>
  );
};
