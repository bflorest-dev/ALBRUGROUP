/**
 * Barrel export para feature: ofertas-laborales
 * 
 * FSD —— Política de exportación
 * ✓ PÚBLICO: componentes que otros features pueden consumir
 * ✗ INTERNO: componentes que solo usan otros del feature (se importan con rutas relativas)
 * 
 * PÚBLICO:
 *   - OfertaLaboralForm (usado por PaginaOfertasLaboralesNueva, PaginaRRHH)
 *   - ListadoOfertasActivas (usado por PaginaListadoOfertasActivas, PaginaRRHH)
 *   - useOfertaLaboralForm, useOfertasActivas (hooks reutilizables)
 * 
 * INTERNO (no exportar — importar con rutas relativas):
 *   - OfertaCard (solo para ListadoOfertasActivas)
 *   - AmpliacionesDetail (solo para OfertaCard)
 *   - SkeletonOfertaCard (solo para ListadoOfertasActivas)
 *   - VacioOfertasActivas (solo para ListadoOfertasActivas)
 *   - ErrorOfertasActivas (solo para ListadoOfertasActivas)
 */

// ============= COMPONENTES PÚBLICOS =============
export { OfertaLaboralForm } from './ui/OfertaLaboralForm';
export { ListadoOfertasActivas } from './ui/ListadoOfertasActivas';

// ============= HOOKS Y TIPOS =============
export { useOfertaLaboralForm, ofertaLaboralSchema } from './model/useOfertaLaboralForm';
export {
	useOfertasActivas,
	useCrearOfertaLaboral,
	useAmpliarOfertaLaboral,
	useActualizarEstadoOferta,
} from './model/useOfertasActivas';

export type { OfertaLaboralFormData, UseOfertaLaboralFormReturn } from './model/useOfertaLaboralForm';
export type { UseOfertasActivasReturn } from './model/useOfertasActivas';
