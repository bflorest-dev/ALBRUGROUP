package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Base;

import java.util.List;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LeadIntakeMasivoExcelResultadoResponse {

    private int fila;
    private String lead;
    private Long idLead;
    private boolean registrado;
    private String mensaje;
    private List<String> advertencias;
    private Base baseUsada;
    private Long idCampanaUsada;
    private String campanaUsada;
    private boolean campanaInferida;
}
