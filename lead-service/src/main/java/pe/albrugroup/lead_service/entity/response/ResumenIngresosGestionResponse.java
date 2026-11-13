package pe.albrugroup.lead_service.entity.response;

/**
 * Tabla 1 del RESUMEN DIARIO. Cada fila conserva la cohorte del período y desglosa PREVENTA
 * en tres conceptos no intercambiables:
 *
 * <ul>
 *   <li>{@code Preventas}: tipificación seleccionada = PREVENTA.</li>
 *   <li>{@code Completas}: PREVENTA con subtipificación COMPLETA.</li>
 *   <li>{@code Validas}: PREVENTA cuya etapa actual ya no es PREVENTA.</li>
 * </ul>
 *
 * La pertenencia al período y la tipificación se leen de {@code Evento}; la etapa actual se lee de
 * {@code Lead.etapa}. El porcentaje lo calcula el frontend.
 */
public record ResumenIngresosGestionResponse(
        long ingresosTotal,
        long ingresosPreventas,
        long ingresosCompletas,
        long ingresosValidas,
        long gestionTotal,
        long gestionPreventas,
        long gestionCompletas,
        long gestionValidas
) {
}
