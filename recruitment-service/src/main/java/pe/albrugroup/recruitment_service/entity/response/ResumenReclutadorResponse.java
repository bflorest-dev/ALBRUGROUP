package pe.albrugroup.recruitment_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumenReclutadorResponse {

    private Negocio negocio;
    private LocalDate fechaReferencia;
    private long nuevosHoy;
    private long porContactar;
    private long sinContactoHoy;
    private long meetsProgramadas;
    private long aprobadosHoy;
    private long desaprobadosHoy;
}
