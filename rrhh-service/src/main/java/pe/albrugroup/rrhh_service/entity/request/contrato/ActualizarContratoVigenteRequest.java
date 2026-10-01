package pe.albrugroup.rrhh_service.entity.request.contrato;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.rrhh_service.entity.enums.CategoriaPersonal;
import pe.albrugroup.rrhh_service.entity.enums.Modalidad;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.enums.Regimen;
import pe.albrugroup.rrhh_service.entity.enums.SeguroSalud;
import pe.albrugroup.rrhh_service.entity.enums.SistemaPensiones;

import java.math.BigDecimal;
import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ActualizarContratoVigenteRequest {

    private CategoriaPersonal categoriaPersonal;

    /** Campo legado conservado durante la migracion de puestos a categorias. */
    @Deprecated(forRemoval = true)
    private PuestoTrabajo puestoTrabajo;

    @NotNull
    private Regimen regimen;

    @NotNull
    private Modalidad modalidad;

    private SeguroSalud seguroSalud;
    private SistemaPensiones sistemaPensiones;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = false)
    @Digits(integer = 10, fraction = 2)
    private BigDecimal sueldoBase;

    @NotNull
    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    @AssertTrue(message = "Debe indicar categoriaPersonal; puestoTrabajo solo se admite durante la transicion")
    @JsonIgnore
    public boolean isClasificacionContractualValida() {
        if (categoriaPersonal == null && puestoTrabajo == null) {
            return false;
        }
        return categoriaPersonal == null
                || puestoTrabajo == null
                || categoriaPersonal == CategoriaPersonal.desdePuestoTrabajo(puestoTrabajo);
    }
}
