package pe.albrugroup.recruitment_service.configuration;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.entity.Subtipificacion;
import pe.albrugroup.recruitment_service.entity.Tipificacion;
import pe.albrugroup.recruitment_service.entity.enums.AlcanceSubtipificacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.request.SubtipificacionRequest;
import pe.albrugroup.recruitment_service.entity.request.TipificacionRequest;
import pe.albrugroup.recruitment_service.repository.SubtipificacionRepository;
import pe.albrugroup.recruitment_service.repository.TipificacionRepository;
import pe.albrugroup.recruitment_service.service.mapper.TipificacionMapper;

@Component @Slf4j
@RequiredArgsConstructor
public class DataLoader {

    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final TipificacionMapper tipificacionMapper;

    @PostConstruct
    @Transactional
    public void loadData() {
        log.info("=================================");
        log.info("Iniciando carga de catalogo reclutamiento");

        crearTipificacionesYSubtipificaciones();

        log.info("Catalogo recruitment cargado");
        log.info("=================================");
    }

    private void crearTipificacionesYSubtipificaciones() {
        Tipificacion sinContacto = saveTipificacion(
                Etapa.RECLUTAMIENTO,
                "SIN_CONTACTO",
                "No se logra una comunicacion efectiva con el postulante",
                1
        );
        saveSubtipificacion(
                sinContacto,
                "NO_CONTESTA",
                "Se intento contactar al postulante y no responde",
                1,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.EN_PROCESO,
                EstadoBandejaPostulacion.SIN_CONTACTO
        );
        saveSubtipificacion(
                sinContacto,
                "NUMERO_EQUIVOCADO",
                "El numero registrado no corresponde al postulante",
                2,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.EN_PROCESO,
                EstadoBandejaPostulacion.SIN_CONTACTO
        );
        saveSubtipificacion(
                sinContacto,
                "FUERA_DE_SERVICIO",
                "La linea se encuentra fuera de servicio",
                3,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.EN_PROCESO,
                EstadoBandejaPostulacion.SIN_CONTACTO
        );
        saveSubtipificacion(
                sinContacto,
                "BUZON_DE_VOZ",
                "La llamada es derivada a buzon de voz",
                4,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.EN_PROCESO,
                EstadoBandejaPostulacion.SIN_CONTACTO
        );

        Tipificacion noInteresado = saveTipificacion(
                Etapa.RECLUTAMIENTO,
                "NO_INTERESADO",
                "El postulante decide no continuar con la oferta laboral",
                2
        );
        saveSubtipificacion(
                noInteresado,
                "NO_DESEA_PUESTO",
                "No desea continuar con el puesto ofrecido",
                1,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.NO_INTERESADO
        );
        saveSubtipificacion(
                noInteresado,
                "PROBLEMAS_CON_HORARIOS",
                "No puede ajustarse a los horarios del puesto",
                2,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.NO_INTERESADO
        );
        saveSubtipificacion(
                noInteresado,
                "DISTANCIA_TIEMPO",
                "La distancia o tiempo de traslado no le conviene",
                3,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.NO_INTERESADO
        );
        saveSubtipificacion(
                noInteresado,
                "BENEFICIOS_PLANILLA",
                "No esta conforme con los beneficios ofrecidos",
                4,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.NO_INTERESADO
        );
        saveSubtipificacion(
                noInteresado,
                "SALARIO_BASE",
                "No esta conforme con el salario base",
                5,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.NO_INTERESADO
        );
        saveSubtipificacion(
                noInteresado,
                "MALA_EXPERIENCIA",
                "Refiere una mala experiencia laboral previa",
                6,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.NO_INTERESADO
        );
        saveSubtipificacion(
                noInteresado,
                "RUBRO_EMPRESA",
                "No desea laborar en el rubro de la empresa",
                7,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.NO_INTERESADO
        );
        saveSubtipificacion(
                noInteresado,
                "RECIBIO_MEJOR_PROPUESTA",
                "Acepto una mejor propuesta laboral",
                8,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.NO_INTERESADO
        );

        Tipificacion interesado = saveTipificacion(
                Etapa.RECLUTAMIENTO,
                "INTERESADO",
                "El postulante muestra interes y continua en gestion",
                3
        );
        saveSubtipificacion(
                interesado,
                "CONFORME_CON_LA_OFERTA",
                "Esta de acuerdo con las condiciones ofrecidas",
                1,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.EN_PROCESO,
                EstadoBandejaPostulacion.EN_GESTION
        );
        saveSubtipificacion(
                interesado,
                "AGENDADO",
                "Queda pendiente una nueva gestion o reunion",
                2,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.EN_PROCESO,
                EstadoBandejaPostulacion.EN_GESTION
        );
        saveSubtipificacion(
                interesado,
                "SEGUIMIENTO",
                "Continua en seguimiento dentro de reclutamiento",
                3,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.EN_PROCESO,
                EstadoBandejaPostulacion.EN_GESTION
        );

        Tipificacion rechazado = saveTipificacion(
                Etapa.RECLUTAMIENTO,
                "RECHAZADO",
                "El postulante es descartado durante reclutamiento",
                4
        );
        saveSubtipificacion(
                rechazado,
                "PERFIL_NO_AJUSTA",
                "El perfil no se ajusta a la vacante",
                1,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );
        saveSubtipificacion(
                rechazado,
                "NO_ASISTIO_MEET",
                "No asistio a la reunion programada",
                2,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );
        saveSubtipificacion(
                rechazado,
                "POCA_FLUIDEZ_VERBAL",
                "No alcanza el nivel de comunicacion esperado",
                3,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );
        saveSubtipificacion(
                rechazado,
                "SIN_HABILIDADES_COMERCIALES",
                "No demuestra habilidades comerciales suficientes",
                4,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );
        saveSubtipificacion(
                rechazado,
                "INEXPERIENCIA",
                "La experiencia no es suficiente para el puesto",
                5,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );
        saveSubtipificacion(
                rechazado,
                "SIN_RESPUESTA_REITERADA",
                "Se cierra el caso tras reiterados intentos sin respuesta",
                6,
                AlcanceSubtipificacion.GENERAL,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );

        Tipificacion reclutado = saveTipificacion(
                Etapa.RECLUTAMIENTO,
                "RECLUTADO",
                "El postulante culmina reclutamiento y pasa a capacitacion",
                5
        );
        saveSubtipificacion(
                reclutado,
                "APTO_PARA_CAPACITACION",
                "Cumple con el perfil y avanza a capacitacion",
                1,
                AlcanceSubtipificacion.GENERAL,
                Etapa.CAPACITACION,
                EstadoPostulacion.EN_PROCESO,
                EstadoBandejaPostulacion.EN_GESTION
        );

        Tipificacion capacitacionEnCurso = saveTipificacion(
                Etapa.CAPACITACION,
                "EN_CURSO",
                "El postulante continua activo dentro del proceso de capacitacion",
                1
        );
        saveSubtipificacion(
                capacitacionEnCurso,
                "ASISTENCIA_CONFIRMADA",
                "El postulante confirma asistencia y continua en capacitacion",
                1,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.EN_PROCESO,
                EstadoBandejaPostulacion.EN_GESTION
        );
        saveSubtipificacion(
                capacitacionEnCurso,
                "SEGUIMIENTO_CAPACITACION",
                "El postulante continua en seguimiento durante capacitacion",
                2,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.EN_PROCESO,
                EstadoBandejaPostulacion.EN_GESTION
        );

        Tipificacion aprobado = saveTipificacion(
                Etapa.CAPACITACION,
                "APROBADO",
                "El postulante aprueba capacitacion y queda listo para contratacion",
                2
        );
        saveSubtipificacion(
                aprobado,
                "APTO_PARA_CONTRATACION",
                "El postulante cumple los criterios y pasa a contratacion",
                1,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                Etapa.CONTRATACION,
                EstadoPostulacion.EN_PROCESO,
                EstadoBandejaPostulacion.EN_GESTION
        );

        Tipificacion desaprobado = saveTipificacion(
                Etapa.CAPACITACION,
                "DESAPROBADO",
                "El postulante no alcanza el resultado esperado en capacitacion",
                3
        );
        saveSubtipificacion(
                desaprobado,
                "NO_PASO_ROLEPLAY",
                "No alcanza el desempeno esperado en roleplay",
                1,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );
        saveSubtipificacion(
                desaprobado,
                "NO_CUMPLE_OBJETIVO",
                "No cumple con los objetivos definidos en capacitacion",
                2,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );
        saveSubtipificacion(
                desaprobado,
                "NO_DESARROLLA_HABILIDADES",
                "No desarrolla las habilidades comerciales requeridas",
                3,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );
        saveSubtipificacion(
                desaprobado,
                "FALTA_ACTITUD_COMERCIAL",
                "No evidencia la actitud comercial esperada para el puesto",
                4,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );
        saveSubtipificacion(
                desaprobado,
                "PROBLEMAS_TRABAJO_EN_EQUIPO",
                "Presenta dificultades relevantes para trabajar en equipo",
                5,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );
        saveSubtipificacion(
                desaprobado,
                "RESULTADOS_INSUFICIENTES_EVALUACIONES",
                "Obtiene resultados insuficientes en las evaluaciones de capacitacion",
                6,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );

        Tipificacion retirado = saveTipificacion(
                Etapa.CAPACITACION,
                "RETIRADO",
                "El postulante abandona o es retirado del proceso de capacitacion",
                4
        );
        saveSubtipificacion(
                retirado,
                "RETIRO_VOLUNTARIO",
                "El postulante decide no continuar con la capacitacion",
                1,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.NO_INTERESADO
        );
        saveSubtipificacion(
                retirado,
                "INASISTENCIA_REITERADA",
                "El postulante acumula inasistencias y se retira del proceso",
                2,
                AlcanceSubtipificacion.ASESOR_VENTAS,
                null,
                EstadoPostulacion.CERRADA,
                EstadoBandejaPostulacion.RECHAZADO
        );
    }

    private Tipificacion saveTipificacion(Etapa etapa, String codigo, String descripcion, Integer orden) {
        return tipificacionRepository.findByEtapaAndCodigo(etapa, codigo)
                .orElseGet(() -> {
                    TipificacionRequest request = TipificacionRequest.builder()
                            .codigo(codigo)
                            .descripcion(descripcion)
                            .orden(orden)
                            .build();
                    Tipificacion entity = tipificacionMapper.toEntity(request);
                    entity.setEtapa(etapa);
                    entity.setActivo(Boolean.TRUE);
                    return tipificacionRepository.save(entity);
                });
    }

    private void saveSubtipificacion(
            Tipificacion tipificacion,
            String codigo,
            String descripcion,
            Integer orden,
            AlcanceSubtipificacion alcance,
            Etapa etapaDestino,
            EstadoPostulacion estadoDestino,
            EstadoBandejaPostulacion estadoBandejaDestino
    ) {
        subtipificacionRepository.findByTipificacionIdAndCodigo(tipificacion.getId(), codigo)
                .orElseGet(() -> {
                    SubtipificacionRequest request = SubtipificacionRequest.builder()
                            .codigo(codigo)
                            .descripcion(descripcion)
                            .orden(orden)
                            .alcance(alcance)
                            .etapaDestino(etapaDestino)
                            .estadoDestino(estadoDestino)
                            .estadoBandejaDestino(estadoBandejaDestino)
                            .build();
                    Subtipificacion entity = tipificacionMapper.toEntity(request);
                    entity.setTipificacion(tipificacion);
                    entity.setActivo(Boolean.TRUE);
                    return subtipificacionRepository.save(entity);
                });
    }
}
