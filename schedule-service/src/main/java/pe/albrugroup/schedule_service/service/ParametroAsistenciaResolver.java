package pe.albrugroup.schedule_service.service;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.entity.ParametroAsistencia;
import pe.albrugroup.schedule_service.repository.ParametroAsistenciaRepository;

import java.util.List;
import java.util.function.Function;

/**
 * Resuelve los parametros de comportamiento efectivos para un empleado, por precedencia:
 * fila por rol > fila global > default de codigo. El equipo se difiere (Fork 3): el esquema tiene
 * id_equipo pero schedule-service aun no conoce el equipo del empleado (no viene en el token).
 *
 * NO incluye politica de descuentos (eso vive en el ms de calculo).
 */
@Service
@RequiredArgsConstructor
public class ParametroAsistenciaResolver {

    // Defaults de codigo (fallback si la tabla no tiene filas). Editables via parametro_asistencia.
    private static final int DEFAULT_MARGEN_ADELANTO_MIN = 5;
    private static final int DEFAULT_TOLERANCIA_TARDANZA_MIN = 5;
    private static final int DEFAULT_BLOQUEO_TARDANZA_MIN = 20;
    private static final int DEFAULT_MAX_MINUTOS_PAUSA_ACTIVA = 5;
    private static final int DEFAULT_MAX_USOS_PAUSA_ACTIVA_DIA = 1;

    private final ParametroAsistenciaRepository repository;

    @Transactional(readOnly = true)
    public EffectiveParams resolve(List<String> roles) {
        List<ParametroAsistencia> porRol = roles == null || roles.isEmpty()
                ? List.of()
                : repository.findByRolInAndIdEquipoIsNull(roles);
        ParametroAsistencia global = repository.findFirstByRolIsNullAndIdEquipoIsNull().orElse(null);

        return EffectiveParams.builder()
                .margenAdelantoMin(pick(porRol, global, ParametroAsistencia::getMargenAdelantoMin, DEFAULT_MARGEN_ADELANTO_MIN))
                .toleranciaTardanzaMin(pick(porRol, global, ParametroAsistencia::getToleranciaTardanzaMin, DEFAULT_TOLERANCIA_TARDANZA_MIN))
                .bloqueoTardanzaMin(pick(porRol, global, ParametroAsistencia::getBloqueoTardanzaMin, DEFAULT_BLOQUEO_TARDANZA_MIN))
                .maxMinutosPausaActiva(pick(porRol, global, ParametroAsistencia::getMaxMinutosPausaActiva, DEFAULT_MAX_MINUTOS_PAUSA_ACTIVA))
                .maxUsosPausaActivaDia(pick(porRol, global, ParametroAsistencia::getMaxUsosPausaActivaDia, DEFAULT_MAX_USOS_PAUSA_ACTIVA_DIA))
                .build();
    }

    /** Primer valor no nulo entre las filas por rol, luego la global, luego el default. */
    private int pick(List<ParametroAsistencia> porRol, ParametroAsistencia global,
                     Function<ParametroAsistencia, Integer> field, int defecto) {
        for (ParametroAsistencia p : porRol) {
            Integer v = field.apply(p);
            if (v != null) {
                return v;
            }
        }
        if (global != null && field.apply(global) != null) {
            return field.apply(global);
        }
        return defecto;
    }

    @Builder
    public record EffectiveParams(
            int margenAdelantoMin,
            int toleranciaTardanzaMin,
            int bloqueoTardanzaMin,
            int maxMinutosPausaActiva,
            int maxUsosPausaActivaDia
    ) {}
}
