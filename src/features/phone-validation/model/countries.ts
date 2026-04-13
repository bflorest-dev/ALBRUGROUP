/**
 * Countries List - Prefijos telefónicos y códigos de país
 * Datos estáticos para select de país en formularios
 */

export interface CountryPrefix {
  code: string;       // ej: ES, US, AR
  name: string;       // ej: Spain, United States, Argentina
  prefix: string;     // ej: +34, +1, +54
  flag: string;       // ej: 🇪🇸
}

export const COUNTRIES: CountryPrefix[] = [
  { code: 'ES', name: 'España', prefix: '+34', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', prefix: '+1', flag: '🇺🇸' },
  { code: 'MX', name: 'México', prefix: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', prefix: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', prefix: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', prefix: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', prefix: '+51', flag: '🇵🇪' },
  { code: 'EC', name: 'Ecuador', prefix: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', prefix: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', prefix: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', prefix: '+598', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', prefix: '+58', flag: '🇻🇪' },
  { code: 'BR', name: 'Brasil', prefix: '+55', flag: '🇧🇷' },
  { code: 'GB', name: 'Reino Unido', prefix: '+44', flag: '🇬🇧' },
  { code: 'FR', name: 'Francia', prefix: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', prefix: '+49', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', prefix: '+39', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', prefix: '+351', flag: '🇵🇹' },
  { code: 'PL', name: 'Polonia', prefix: '+48', flag: '🇵🇱' },
  { code: 'RO', name: 'Rumania', prefix: '+40', flag: '🇷🇴' },
  { code: 'CZ', name: 'República Checa', prefix: '+420', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungría', prefix: '+36', flag: '🇭🇺' },
  { code: 'SE', name: 'Suecia', prefix: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Noruega', prefix: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Dinamarca', prefix: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finlandia', prefix: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Irlanda', prefix: '+353', flag: '🇮🇪' },
  { code: 'BE', name: 'Bélgica', prefix: '+32', flag: '🇧🇪' },
  { code: 'NL', name: 'Países Bajos', prefix: '+31', flag: '🇳🇱' },
  { code: 'CH', name: 'Suiza', prefix: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', prefix: '+43', flag: '🇦🇹' },
  { code: 'GR', name: 'Grecia', prefix: '+30', flag: '🇬🇷' },
  { code: 'TR', name: 'Turquía', prefix: '+90', flag: '🇹🇷' },
  { code: 'RU', name: 'Rusia', prefix: '+7', flag: '🇷🇺' },
  { code: 'UA', name: 'Ucrania', prefix: '+380', flag: '🇺🇦' },
  { code: 'JP', name: 'Japón', prefix: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'Corea del Sur', prefix: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', prefix: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', prefix: '+91', flag: '🇮🇳' },
  { code: 'TH', name: 'Tailandia', prefix: '+66', flag: '🇹🇭' },
  { code: 'PH', name: 'Filipinas', prefix: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', prefix: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'Malasia', prefix: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapur', prefix: '+65', flag: '🇸🇬' },
  { code: 'VN', name: 'Vietnam', prefix: '+84', flag: '🇻🇳' },
  { code: 'AU', name: 'Australia', prefix: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'Nueva Zelanda', prefix: '+64', flag: '🇳🇿' },
  { code: 'ZA', name: 'Sudáfrica', prefix: '+27', flag: '🇿🇦' },
  { code: 'EG', name: 'Egipto', prefix: '+20', flag: '🇪🇬' },
  { code: 'IL', name: 'Israel', prefix: '+972', flag: '🇮🇱' },
  { code: 'SA', name: 'Arabia Saudita', prefix: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'Emiratos Árabes Unidos', prefix: '+971', flag: '🇦🇪' },
  { code: 'HK', name: 'Hong Kong', prefix: '+852', flag: '🇭🇰' },
  { code: 'TW', name: 'Taiwán', prefix: '+886', flag: '🇹🇼' },
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
    label: `${country.flag} ${country.name} ${country.prefix}`, // Bandera + país + prefijo
    metadata: { code: country.code }, // Guardamos el código para referencia
  }));
}
