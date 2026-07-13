package pe.albrugroup.lead_service.entity.request;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

/**
 * Copia la matriz activa de una etapa desde un equipo origen a un equipo destino. Sirve para dar de
 * alta la matriz de un equipo nuevo o para dejar la matriz de un equipo igual a la de otro.
 */
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ClonarMatrizRequest {

    @NotNull
    @Enumerated(EnumType.STRING)
    private Etapa etapa;

    @NotNull
    private Long idEquipoOrigen;

    @NotNull
    private Long idEquipoDestino;
}
