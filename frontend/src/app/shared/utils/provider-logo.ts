/**
 * Logo del proveedor a partir de su nombre (WIN/CLARO). Devuelve la ruta del asset o null si no hay
 * logo conocido. Fuente única para la bandeja GTR y la del asesor, así el origen del lead se ve igual
 * en ambas vistas.
 */
export function providerLogo(nombreProveedor?: string | null): string | null {
  const normalized = (nombreProveedor ?? '').trim().toUpperCase();
  if (normalized === 'WIN') {
    return '/provider-logos/WIN.png';
  }
  if (normalized === 'CLARO') {
    return '/provider-logos/CLARO.png';
  }
  return null;
}
