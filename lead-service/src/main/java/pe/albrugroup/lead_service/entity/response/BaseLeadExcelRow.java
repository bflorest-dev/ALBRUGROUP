package pe.albrugroup.lead_service.entity.response;

import pe.albrugroup.lead_service.entity.enums.Unidad;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Fila plana para el export Excel de Base de Leads. Se resuelve por ids (la seleccion viene del
 * mismo filtro que el .alb) y trae los datos ricos que el .alb no incluye. Los nombres de
 * departamento/provincia/distrito NO viajan aqui: se resuelven aparte desde {@code ubigeoDomicilio}.
 */
public record BaseLeadExcelRow(
        Long id,
        String documento,
        String nombreTitular,
        String nombrePlan,
        Integer velocidad,
        Unidad unidad,
        BigDecimal precio,
        LocalDate fechaInstalacion,
        String ubigeoDomicilio,
        String asesorPreventa
) {}
