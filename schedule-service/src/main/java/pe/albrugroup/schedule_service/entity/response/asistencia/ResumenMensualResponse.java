package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Resumen mensual CERRADO de un empleado: hechos balanceados (sin dinero). Es el artefacto de
 * hand-off al ms de calculo. Solo existe para meses pasados (snapshot); el mes en curso se consulta
 * en vivo por otra ruta. {@code balanceFinal} es el deficit no compensado (<= 0); {@code minutosExtra}
 * y {@code minutosCompensados} van aparte del balance.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumenMensualResponse {

    private Long idEmpleado;
    private Integer anio;
    private Integer mes;
    private Instant fechaCierre;

    private Integer diasLaborables;
    private Integer diasPresente;
    private Integer diasTardanza;
    private Integer diasTardanzaCompensable;
    private Integer diasTardanzaJustificada;
    private Integer diasFalta;

    private Integer minutosObjetivo;
    private Integer minutosTrabajados;
    private Integer balanceFinal;
    private Integer minutosExtra;
    private Integer minutosCompensados;
    private Integer cantidadTardanzas;
}
