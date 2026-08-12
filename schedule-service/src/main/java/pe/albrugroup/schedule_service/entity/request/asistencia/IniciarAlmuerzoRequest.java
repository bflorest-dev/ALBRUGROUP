package pe.albrugroup.schedule_service.entity.request.asistencia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Cuerpo (opcional) para iniciar ALMUERZO. Ambos flags los provee el frontend.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IniciarAlmuerzoRequest {

    /**
     * El cliente indica que la bandeja ya esta vacia al entrar al estado: el contador de almuerzo
     * arranca de inmediato. Para roles sin bandeja el frontend envia true.
     */
    private boolean bandejaVacia;

    /**
     * true si el estado lo forzo el sistema (frontend) a la hora programada porque el empleado no lo
     * marco; false si lo marco el propio empleado. Solo metadata (origenAlmuerzo).
     */
    private boolean forzado;
}
