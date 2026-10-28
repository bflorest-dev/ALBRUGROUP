package pe.albrugroup.lead_service.entity.response;

import java.math.BigDecimal;
import java.util.List;

public record ResumenGastosMensualResponse(
        int anio,
        int mes,
        List<GrupoResumen> grupos,
        BigDecimal subtotalFijos,
        BigDecimal subtotalVariables,
        BigDecimal ctaBancaria,
        BigDecimal ctaPublicitaria,
        BigDecimal cashbackPreventa,
        BigDecimal cashbackPostventa,
        BigDecimal totalGeneral
) {
    public record GrupoResumen(
            Long idGrupo,
            String nombreGrupo,
            int orden,
            List<LineaGasto> lineas,
            BigDecimal subtotalGrupo
    ) {}

    public record LineaGasto(
            Long idTipoGasto,
            String nombreTipoGasto,
            String categoria,
            BigDecimal acumuladoMes,
            int cantidadRegistros
    ) {}
}
