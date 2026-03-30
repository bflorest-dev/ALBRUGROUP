/**
 * Countries List - Prefijos telefónicos y códigos de país
 * Datos estáticos para select de país en formularios
 */

export interface CountryPrefix {
  code: string;       // ej: ES, US, AR
  name: string;       // ej: Spain, United States, Argentina
  prefix: string;     // ej: +34, +1, +54
}

export const COUNTRIES: CountryPrefix[] = [
  { code: 'ES', name: 'España', prefix: '+34' },
  { code: 'US', name: 'Estados Unidos', prefix: '+1' },
  { code: 'MX', name: 'México', prefix: '+52' },
  { code: 'AR', name: 'Argentina', prefix: '+54' },
  { code: 'CL', name: 'Chile', prefix: '+56' },
  { code: 'CO', name: 'Colombia', prefix: '+57' },
  { code: 'PE', name: 'Perú', prefix: '+51' },
  { code: 'EC', name: 'Ecuador', prefix: '+593' },
  { code: 'BO', name: 'Bolivia', prefix: '+591' },
  { code: 'PY', name: 'Paraguay', prefix: '+595' },
  { code: 'UY', name: 'Uruguay', prefix: '+598' },
  { code: 'VE', name: 'Venezuela', prefix: '+58' },
  { code: 'BR', name: 'Brasil', prefix: '+55' },
  { code: 'GB', name: 'Reino Unido', prefix: '+44' },
  { code: 'FR', name: 'Francia', prefix: '+33' },
  { code: 'DE', name: 'Alemania', prefix: '+49' },
  { code: 'IT', name: 'Italia', prefix: '+39' },
  { code: 'PT', name: 'Portugal', prefix: '+351' },
  { code: 'PL', name: 'Polonia', prefix: '+48' },
  { code: 'RO', name: 'Rumania', prefix: '+40' },
  { code: 'CZ', name: 'República Checa', prefix: '+420' },
  { code: 'HU', name: 'Hungría', prefix: '+36' },
  { code: 'SE', name: 'Suecia', prefix: '+46' },
  { code: 'NO', name: 'Noruega', prefix: '+47' },
  { code: 'DK', name: 'Dinamarca', prefix: '+45' },
  { code: 'FI', name: 'Finlandia', prefix: '+358' },
  { code: 'IE', name: 'Irlanda', prefix: '+353' },
  { code: 'BE', name: 'Bélgica', prefix: '+32' },
  { code: 'NL', name: 'Países Bajos', prefix: '+31' },
  { code: 'CH', name: 'Suiza', prefix: '+41' },
  { code: 'AT', name: 'Austria', prefix: '+43' },
  { code: 'GR', name: 'Grecia', prefix: '+30' },
  { code: 'TR', name: 'Turquía', prefix: '+90' },
  { code: 'RU', name: 'Rusia', prefix: '+7' },
  { code: 'UA', name: 'Ucrania', prefix: '+380' },
  { code: 'JP', name: 'Japón', prefix: '+81' },
  { code: 'KR', name: 'Corea del Sur', prefix: '+82' },
  { code: 'CN', name: 'China', prefix: '+86' },
  { code: 'IN', name: 'India', prefix: '+91' },
  { code: 'TH', name: 'Tailandia', prefix: '+66' },
  { code: 'PH', name: 'Filipinas', prefix: '+63' },
  { code: 'ID', name: 'Indonesia', prefix: '+62' },
  { code: 'MY', name: 'Malasia', prefix: '+60' },
  { code: 'SG', name: 'Singapur', prefix: '+65' },
  { code: 'VN', name: 'Vietnam', prefix: '+84' },
  { code: 'AU', name: 'Australia', prefix: '+61' },
  { code: 'NZ', name: 'Nueva Zelanda', prefix: '+64' },
  { code: 'ZA', name: 'Sudáfrica', prefix: '+27' },
  { code: 'EG', name: 'Egipto', prefix: '+20' },
  { code: 'IL', name: 'Israel', prefix: '+972' },
  { code: 'SA', name: 'Arabia Saudita', prefix: '+966' },
  { code: 'AE', name: 'Emiratos Árabes Unidos', prefix: '+971' },
  { code: 'SG', name: 'Singapur', prefix: '+65' },
  { code: 'HK', name: 'Hong Kong', prefix: '+852' },
  { code: 'TW', name: 'Taiwán', prefix: '+886' },
];

/**
 * Obtener país por código
 */
export function getCountryByCode(code: string): CountryPrefix | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

/**
 * Obtener país por prefijo
 */
export function getCountryByPrefix(prefix: string): CountryPrefix | undefined {
  return COUNTRIES.find((c) => c.prefix === prefix);
}

/**
 * Crear opciones para FormSelect
 */
export function getCountryOptions() {
  return COUNTRIES.map((country) => ({
    value: country.prefix, // Devolvemos el prefijo (+34)
    label: `${country.name} (${country.prefix})`, // Mostramos país + prefijo
    metadata: { code: country.code }, // Guardamos el código para referencia
  }));
}
