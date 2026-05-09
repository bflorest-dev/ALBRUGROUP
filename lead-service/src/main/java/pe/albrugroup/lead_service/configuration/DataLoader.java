package pe.albrugroup.lead_service.configuration;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Adicional;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.CuentaPublicitaria;
import pe.albrugroup.lead_service.entity.Internet;
import pe.albrugroup.lead_service.entity.Plan;
import pe.albrugroup.lead_service.entity.PlanAdicional;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Telefono;
import pe.albrugroup.lead_service.entity.Television;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.EstadoPostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.Tecnologia;
import pe.albrugroup.lead_service.entity.enums.Unidad;
import pe.albrugroup.lead_service.entity.request.SubtipificacionRequest;
import pe.albrugroup.lead_service.entity.request.TipificacionRequest;
import pe.albrugroup.lead_service.repository.AdicionalRepository;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.CuentaPublicitariaRepository;
import pe.albrugroup.lead_service.repository.InternetRepository;
import pe.albrugroup.lead_service.repository.PlanAdicionalRepository;
import pe.albrugroup.lead_service.repository.PlanRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TelefonoRepository;
import pe.albrugroup.lead_service.repository.TelevisionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.service.mapper.TipificacionMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Component
@Profile("dev")
@Slf4j
@RequiredArgsConstructor
public class DataLoader {

    private final UbigeoDataLoader ubigeoDataLoader;
    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final ProveedorRepository proveedorRepository;
    private final CuentaPublicitariaRepository cuentaPublicitariaRepository;
    private final CampanaRepository campanaRepository;
    private final AdicionalRepository adicionalRepository;
    private final PlanRepository planRepository;
    private final PlanAdicionalRepository planAdicionalRepository;
    private final InternetRepository internetRepository;
    private final TelefonoRepository telefonoRepository;
    private final TelevisionRepository televisionRepository;
    private final TipificacionMapper tipificacionMapper;

    @PostConstruct
    @Transactional
    public void loadData() {
        log.info("=================================");
        log.info("Iniciando carga de catalogo inicial");

        ubigeoDataLoader.cargarUbigeoDesdeResources();
        crearTipificacionesYSubtipificaciones();
        crearCatalogoComercialBase();

        log.info("Catalogo cargado");
        log.info("=================================");
    }

    private void crearTipificacionesYSubtipificaciones() {
        Tipificacion sinContacto = saveTipificacion(Etapa.PREVENTA, "SIN_CONTACTO", "No se logra la comunicacion", 1);
        saveSubtipificacion(sinContacto, "NO_CONTESTA", "No responde llamadas o chat", 1);
        saveSubtipificacion(sinContacto, "NUMERO_EQUIVOCADO", "Numero invalido o incorrecto", 2);
        saveSubtipificacion(sinContacto, "FUERA_DE_SERVICIO", "Numero sin servicio de red", 3);
        saveSubtipificacion(sinContacto, "BUZON_DE_VOZ", "Numero desvia llamadas al buzon de voz", 4);

        Tipificacion enSeguimiento = saveTipificacion(Etapa.PREVENTA, "SEGUIMIENTO", "Cliente en seguimiento comercial", 2);
        saveSubtipificacion(enSeguimiento, "SOLO_INFORMACION", "Solicita llamar luego", 1);
        saveSubtipificacion(enSeguimiento, "SEGUIMIENTO", "Seguimiento pendiente de cierre", 2);
        saveSubtipificacion(enSeguimiento, "GESTION_CHAT", "Seguimiento en curso por chat", 3);
        saveSubtipificacion(enSeguimiento, "LLAMADA_INTERRUMPIDA", "Contacto interrumpido durante la llamada", 4);

        Tipificacion agendado = saveTipificacion(Etapa.PREVENTA, "AGENDADO", "Contacto reagendado para una fecha futura", 3);
        saveSubtipificacion(agendado, "FIN_DE_MES", "Solicita retomar el contacto a fin de mes", 1);
        saveSubtipificacion(agendado, "CONSULTARA_CON_FAMILIAR", "Debe validar la decision con un familiar", 2);
        saveSubtipificacion(agendado, "AGENDADO", "Comunicacion reagendada con el cliente", 3);

        Tipificacion rechazado = saveTipificacion(Etapa.PREVENTA, "RECHAZADO", "Operacion descartada en preventa", 4);
        saveSubtipificacion(rechazado, "ZONA_FRAUDE", "Zona observada por validacion de fraude", 1);
        saveSubtipificacion(rechazado, "VC_DESAPROBADA", "Validacion comercial desaprobada", 2);
        saveSubtipificacion(rechazado, "NO_DESEA", "Cliente no desea continuar con la oferta", 3);
        saveSubtipificacion(rechazado, "NO_CALIFICA", "Cliente no cumple las condiciones comerciales", 4);
        saveSubtipificacion(rechazado, "CON_PROGRAMACION", "Cliente ya cuenta con una programacion previa", 5);

        Tipificacion reiterado = saveTipificacion(Etapa.PREVENTA, "REITERADO", "Lead repetido o duplicado", 5);
        saveSubtipificacion(reiterado, "ND_PUBLICIDAD", "Lead duplicado por origen publicitario", 1);
        saveSubtipificacion(reiterado, "DOBLE_CLICK", "Registro duplicado por doble envio del cliente", 2);

        Tipificacion sinFacilidades = saveTipificacion(Etapa.PREVENTA, "SIN_FACILIDADES", "Operacion inviable por restricciones del servicio", 6);
        saveSubtipificacion(sinFacilidades, "SIN_CTO", "No cuenta con condiciones tecnicas para instalar", 1);
        saveSubtipificacion(sinFacilidades, "SIN_COBERTURA", "La direccion no tiene cobertura disponible", 2);
        saveSubtipificacion(sinFacilidades, "SERVICIO_ACTIVO", "La direccion ya tiene un servicio activo", 3);
        saveSubtipificacion(sinFacilidades, "EDIFICIO_SIN_LIBERAR", "El edificio aun no esta liberado para instalacion", 4);

        Tipificacion scorePreventa = saveTipificacion(Etapa.PREVENTA, "SCORE_PREVENTA", "Validacion de score previa a la venta", 7);
        saveSubtipificacion(scorePreventa, "PREVENTA_INCOMPLETA", "Score validado en etapa de preventa", 1);
        saveSubtipificacion(scorePreventa, "PDTE_SCORE", "Validacion de score pendiente", 2);

        Tipificacion preventaCompleta = saveTipificacion(Etapa.PREVENTA, "PREVENTA_COMPLETA", "Gestion de preventa finalizada", 8);
        saveSubtipificacion(preventaCompleta, "VENTA_CERRADA", "Venta cerrada en la gestion actual", 1, Etapa.VENTA);
        saveSubtipificacion(preventaCompleta, "VC_SIGUIENTE_MES", "Venta proyectada para el siguiente mes", 2);

        Tipificacion listaNegra = saveTipificacion(Etapa.PREVENTA, "LISTA_NEGRA", "Lead restringido por lista negra", 9);
        saveSubtipificacion(listaNegra, "BLACKLIST", "Lead bloqueado por politica de blacklist", 1);

        Tipificacion seguimientoPostventa = saveTipificacion(Etapa.POSTVENTA, "SEGUIMIENTO", "Seguimiento de servicio instalado", 1);
        saveSubtipificacion(seguimientoPostventa, "SERVICIO_ACTIVO", "Cliente mantiene el servicio activo", 1, null, EstadoPostventa.EN_SEGUIMIENTO);
        saveSubtipificacion(seguimientoPostventa, "CLIENTE_SATISFECHO", "Cliente conforme con el servicio", 2, null, EstadoPostventa.EN_SEGUIMIENTO);

        Tipificacion incidenciaPostventa = saveTipificacion(Etapa.POSTVENTA, "INCIDENCIA", "Incidencia detectada durante la postventa", 2);
        saveSubtipificacion(incidenciaPostventa, "PAGO_PENDIENTE", "Cliente presenta pago pendiente", 1, Etapa.COBRANZA, EstadoPostventa.EN_COBRANZA);
        saveSubtipificacion(incidenciaPostventa, "RIESGO_BAJA", "Cliente presenta riesgo de baja", 2, null, EstadoPostventa.PAGO_PENDIENTE);
        saveSubtipificacion(incidenciaPostventa, "BAJA_CONFIRMADA", "Proveedor confirma baja del servicio", 3, null, EstadoPostventa.BAJA_CONFIRMADA);

        Tipificacion cierrePostventa = saveTipificacion(Etapa.POSTVENTA, "CIERRE", "Cierre de seguimiento postventa", 3);
        saveSubtipificacion(cierrePostventa, "EFECTIVO", "Lead cumple permanencia requerida", 1, null, EstadoPostventa.EFECTIVO);
        saveSubtipificacion(cierrePostventa, "NO_EFECTIVO", "Lead no cumple permanencia requerida", 2, null, EstadoPostventa.NO_EFECTIVO);

        Tipificacion gestionCobranza = saveTipificacion(Etapa.COBRANZA, "GESTION_PAGO", "Gestion de pago pendiente", 1);
        saveSubtipificacion(gestionCobranza, "COMPROMISO_PAGO", "Cliente asume compromiso de pago", 1, null, EstadoPostventa.PAGO_PENDIENTE);
        saveSubtipificacion(gestionCobranza, "PAGO_CLIENTE", "Pago regularizado por el cliente", 2, Etapa.POSTVENTA, EstadoPostventa.EN_SEGUIMIENTO);
        saveSubtipificacion(gestionCobranza, "PAGO_EMPRESA", "Pago cubierto por la empresa", 3, Etapa.POSTVENTA, EstadoPostventa.PAGO_CUBIERTO_EMPRESA);

        Tipificacion cierreCobranza = saveTipificacion(Etapa.COBRANZA, "CIERRE", "Cierre de gestion de cobranza", 2);
        saveSubtipificacion(cierreCobranza, "BAJA_CONFIRMADA", "Proveedor confirma baja del servicio", 1, null, EstadoPostventa.BAJA_CONFIRMADA);
        saveSubtipificacion(cierreCobranza, "NO_EFECTIVO", "Lead no cumple permanencia requerida", 2, null, EstadoPostventa.NO_EFECTIVO);
    }

    private Tipificacion saveTipificacion(Etapa etapa, String codigo, String descripcion, Integer orden) {
        return tipificacionRepository.findByEtapaAndCodigo(etapa, codigo)
                .orElseGet(() -> {
                    TipificacionRequest request = TipificacionRequest.builder()
                            .etapa(etapa)
                            .codigo(codigo)
                            .descripcion(descripcion)
                            .orden(orden)
                            .build();
                    Tipificacion entity = tipificacionMapper.toEntity(request);
                    entity.setActivo(Boolean.TRUE);
                    return tipificacionRepository.save(entity);
                });
    }

    private void saveSubtipificacion(Tipificacion tipificacion, String codigo, String descripcion, Integer orden) {
        saveSubtipificacion(tipificacion, codigo, descripcion, orden, null);
    }

    private void saveSubtipificacion(Tipificacion tipificacion, String codigo, String descripcion, Integer orden, Etapa etapaCambio) {
        saveSubtipificacion(tipificacion, codigo, descripcion, orden, etapaCambio, null);
    }

    private void saveSubtipificacion(
            Tipificacion tipificacion,
            String codigo,
            String descripcion,
            Integer orden,
            Etapa etapaCambio,
            EstadoPostventa estadoPostventaCambio
    ) {
        subtipificacionRepository.findByTipificacionIdAndCodigo(tipificacion.getId(), codigo)
                .ifPresentOrElse(
                        subtipificacion -> {
                            subtipificacion.setDescripcion(descripcion);
                            subtipificacion.setOrden(orden);
                            subtipificacion.setEtapaCambio(etapaCambio);
                            subtipificacion.setEstadoPostventaCambio(estadoPostventaCambio);
                            subtipificacion.setActivo(Boolean.TRUE);
                            subtipificacionRepository.save(subtipificacion);
                        },
                        () -> {
                    SubtipificacionRequest request = SubtipificacionRequest.builder()
                            .tipificacionId(tipificacion.getId())
                            .codigo(codigo)
                            .descripcion(descripcion)
                            .orden(orden)
                            .etapaCambio(etapaCambio)
                            .estadoPostventaCambio(estadoPostventaCambio)
                            .build();
                    Subtipificacion entity = tipificacionMapper.toEntity(request);
                    entity.setTipificacion(tipificacion);
                    entity.setActivo(Boolean.TRUE);
                    subtipificacionRepository.save(entity);
                        }
                );
    }

    private void crearCatalogoComercialBase() {
        Proveedor win = saveProveedor("WIN", Set.of(1, 2), 3);
        Proveedor claro = saveProveedor("CLARO", Set.of(1, 2), 5);
        Proveedor mifibra = saveProveedor("MIFIBRA",  Set.of(1, 2), 3);
        Proveedor perufibra = saveProveedor("PERUFIBRA", Set.of(1, 2), 3);

        CuentaPublicitaria runa = saveCuentaPublicitaria("1822236612034217", "Runa Contact Center");
        CuentaPublicitaria fibra = saveCuentaPublicitaria("1030035362376438", "Internet Fibra Optica");
        CuentaPublicitaria distribuidor = saveCuentaPublicitaria("708788522032129", "DISTRIBUIDOR AUTORIZADO");
        CuentaPublicitaria albru = saveCuentaPublicitaria("1587625665850135", "ALBRU 2");

        saveCampana("Win4 - 100% Fibra Optica", "51905749473", runa, win, Boolean.TRUE);
        saveCampana("Win1 - Satisfaccion al cliente", "51905749473", runa, win, Boolean.FALSE);
        saveCampana("Win6 - Internet Winners", "51905749473", runa, win, Boolean.FALSE);
        saveCampana("Win2 - Internet Hogar", "51905749473", fibra, win, Boolean.FALSE);
        saveCampana("Prueba Ventas Win9 - Win10", "51905749473", distribuidor, win, Boolean.FALSE);
        saveCampana("CLARO12 - CAMPANA CLARO", "51987654321", albru, claro, Boolean.FALSE);

        saveAdicional("Wifi Mesh", new BigDecimal("9.90"), win);
        saveAdicional("WinBox", new BigDecimal("15.00"), win);
        Adicional mifibraMesh = saveAdicional("Mesh", new BigDecimal("5.00"), mifibra);
        saveAdicional("Repetidor - Fibra", new BigDecimal("10.00"), claro);
        saveAdicional("Repetidor - HFC", new BigDecimal("15.00"), claro);
        saveAdicional("Decodificador - Fibra", new BigDecimal("10.00"), claro);
        saveAdicional("Decodificador - HFC", new BigDecimal("10.00"), claro);
        saveAdicional("Repetidor - Fibra", new BigDecimal("10.00"), perufibra);
        saveAdicional("Repetidor - HFC", new BigDecimal("10.00"), perufibra);

        cargarPlanesMiFibra(mifibra, mifibraMesh);
    }

    private Proveedor saveProveedor(String nombre) {
        return saveProveedor(nombre, Set.of(), null);
    }

    private Proveedor saveProveedor(String nombre, Set<Integer> cortesFacturacion, Integer mesesPermanencia) {
        return proveedorRepository.listarPorActivo(Boolean.TRUE).stream()
                .filter(proveedor -> proveedor.getNombre().equalsIgnoreCase(nombre))
                .findFirst()
                .map(proveedor -> {
                    if (!cortesFacturacion.isEmpty()) {
                        proveedor.setCortesFacturacion(new HashSet<>(cortesFacturacion));
                    }
                    if (mesesPermanencia != null) {
                        proveedor.setMesesPermanencia(mesesPermanencia);
                    }
                    return proveedorRepository.save(proveedor);
                })
                .orElseGet(() -> proveedorRepository.save(Proveedor.builder()
                        .nombre(nombre)
                        .cortesFacturacion(new HashSet<>(cortesFacturacion))
                        .mesesPermanencia(mesesPermanencia)
                        .activo(Boolean.TRUE)
                        .build()));
    }

    private CuentaPublicitaria saveCuentaPublicitaria(String numeroCuenta, String nombreCuenta) {
        return cuentaPublicitariaRepository.listarPorActivo(Boolean.TRUE).stream()
                .filter(cuenta -> numeroCuenta.equalsIgnoreCase(cuenta.getNumeroCuenta()))
                .findFirst()
                .orElseGet(() -> cuentaPublicitariaRepository.save(CuentaPublicitaria.builder()
                        .numeroCuenta(numeroCuenta)
                        .nombreCuenta(nombreCuenta)
                        .activo(Boolean.TRUE)
                        .build()));
    }

    private Campana saveCampana(
            String nombre,
            String numeroWhatsappEmpresa,
            CuentaPublicitaria cuentaPublicitaria,
            Proveedor proveedor,
            Boolean activo
    ) {
        return campanaRepository.findByNombre(nombre)
                .orElseGet(() -> campanaRepository.save(Campana.builder()
                        .nombre(nombre)
                        .numeroWhatsappEmpresa(numeroWhatsappEmpresa)
                        .cuentaPublicitaria(cuentaPublicitaria)
                        .proveedor(proveedor)
                        .activo(activo)
                        .build()));
    }

    private Adicional saveAdicional(String nombre, BigDecimal precioUnitario, Proveedor proveedor) {
        return adicionalRepository.findByProveedorIdAndActivoTrueOrderByNombreAsc(proveedor.getId()).stream()
                .filter(adicional -> adicional.getNombre().equalsIgnoreCase(nombre))
                .findFirst()
                .orElseGet(() -> adicionalRepository.save(Adicional.builder()
                        .nombre(nombre)
                        .precioUnitario(precioUnitario)
                        .proveedor(proveedor)
                        .activo(Boolean.TRUE)
                        .build()));
    }

    private void cargarPlanesMiFibra(Proveedor proveedor, Adicional adicional) {
        Internet internet500 = obtenerOCrearInternet(proveedor, 500, Unidad.MBPS, Tecnologia.FTTH);
        Internet internet1500 = obtenerOCrearInternet(proveedor, 1500, Unidad.MBPS, Tecnologia.FTTH);
        Internet internet2500 = obtenerOCrearInternet(proveedor, 2500, Unidad.MBPS, Tecnologia.FTTH);
        Internet internet5000 = obtenerOCrearInternet(proveedor, 5000, Unidad.MBPS, Tecnologia.FTTH);
        Television tvGoL1Max = obtenerOCrearTelevision(proveedor, "TV GO + L1 MAX", 80);

        savePlan(
                proveedor,
                "Plan Internet",
                new BigDecimal("80.00"),
                new BigDecimal("59.90"),
                4,
                LocalDate.of(2026, 4, 1),
                null,
                internet500,
                null,
                null,
                1000,
                6,
                adicional,
                1,
                Boolean.TRUE,
                3
        );

        savePlan(
                proveedor,
                "Plan Internet",
                new BigDecimal("99.90"),
                new BigDecimal("59.90"),
                4,
                LocalDate.of(2026, 4, 1),
                null,
                internet1500,
                null,
                null,
                2000,
                6,
                adicional,
                1,
                Boolean.TRUE,
                3
        );

        savePlan(
                proveedor,
                "Plan Internet",
                new BigDecimal("129.90"),
                new BigDecimal("69.90"),
                4,
                LocalDate.of(2026, 4, 1),
                null,
                internet2500,
                tvGoL1Max,
                null,
                3000,
                12,
                adicional,
                1,
                Boolean.TRUE,
                3
        );

        savePlan(
                proveedor,
                "Plan Internet",
                new BigDecimal("189.90"),
                new BigDecimal("99.90"),
                4,
                LocalDate.of(2026, 4, 1),
                null,
                internet5000,
                tvGoL1Max,
                null,
                null,
                null,
                adicional,
                1,
                Boolean.TRUE,
                3
        );
    }

    private Plan savePlan(
            Proveedor proveedor,
            String nombre,
            BigDecimal precio,
            BigDecimal precioPromocional,
            Integer mesesPromocionPrecio,
            LocalDate vigenciaDesde,
            LocalDate vigenciaHasta,
            Internet internet,
            Television television,
            Telefono telefono,
            Integer velocidadPromocional,
            Integer mesesPromocionVelocidad,
            Adicional adicional,
            Integer cantidadIncluida,
            Boolean permiteCompraAdicional,
            Integer cantidadMaximaAdicional
    ) {
        Plan existente = planRepository.listarActivos(proveedor.getId(), false, LocalDate.now()).stream()
                .filter(plan -> plan.getNombre().equalsIgnoreCase(nombre))
                .filter(plan -> Objects.equals(plan.getPrecio(), precio))
                .filter(plan -> Objects.equals(obtenerVelocidadInternet(plan.getInternet()), obtenerVelocidadInternet(internet)))
                .filter(plan -> Objects.equals(obtenerNombreTelevision(plan.getTelevision()), obtenerNombreTelevision(television)))
                .filter(plan -> Objects.equals(obtenerDescripcionTelefono(plan.getTelefono()), obtenerDescripcionTelefono(telefono)))
                .findFirst()
                .orElse(null);
        if (existente != null) {
            return existente;
        }

        Plan plan = Plan.builder()
                .proveedor(proveedor)
                .nombre(nombre)
                .precio(precio)
                .precioPromocional(precioPromocional)
                .mesesPromocionPrecio(mesesPromocionPrecio)
                .vigenciaDesde(vigenciaDesde)
                .vigenciaHasta(vigenciaHasta)
                .internet(internet)
                .television(television)
                .telefono(telefono)
                .velocidadPromocional(velocidadPromocional)
                .mesesPromocionVelocidad(mesesPromocionVelocidad)
                .activo(Boolean.TRUE)
                .build();
        Plan planGuardado = planRepository.save(plan);

        if (adicional != null) {
            Set<PlanAdicional> adicionales = new HashSet<>();
            PlanAdicional planAdicional = PlanAdicional.builder()
                    .plan(planGuardado)
                    .adicional(adicional)
                    .cantidadIncluida(cantidadIncluida)
                    .permiteCompraAdicional(permiteCompraAdicional)
                    .cantidadMaximaAdicional(cantidadMaximaAdicional)
                    .activo(Boolean.TRUE)
                    .build();
            planAdicionalRepository.save(planAdicional);
            adicionales.add(planAdicional);
            planGuardado.setAdicionales(adicionales);
            planGuardado = planRepository.save(planGuardado);
        }

        return planGuardado;
    }

    private Internet obtenerOCrearInternet(Proveedor proveedor, Integer velocidad, Unidad unidad, Tecnologia tecnologia) {
        return internetRepository.findByProveedorIdAndVelocidadAndUnidadAndTecnologiaAndActivoTrue(
                        proveedor.getId(),
                        velocidad,
                        unidad,
                        tecnologia
                )
                .orElseGet(() -> internetRepository.save(Internet.builder()
                        .velocidad(velocidad)
                        .unidad(unidad)
                        .tecnologia(tecnologia)
                        .proveedor(proveedor)
                        .activo(Boolean.TRUE)
                        .build()));
    }

    private Television obtenerOCrearTelevision(Proveedor proveedor, String nombre, Integer cantidadCanales) {
        return televisionRepository.findByProveedorIdAndNombreIgnoreCaseAndCantidadCanalesAndActivoTrue(
                        proveedor.getId(),
                        nombre,
                        cantidadCanales
                )
                .orElseGet(() -> televisionRepository.save(Television.builder()
                        .nombre(nombre)
                        .cantidadCanales(cantidadCanales)
                        .proveedor(proveedor)
                        .activo(Boolean.TRUE)
                        .build()));
    }

    private Telefono obtenerOCrearTelefono(Proveedor proveedor, Integer minutos, String descripcion) {
        return telefonoRepository.findByProveedorIdAndMinutosAndDescripcionIgnoreCaseAndActivoTrue(
                        proveedor.getId(),
                        minutos,
                        descripcion
                )
                .orElseGet(() -> telefonoRepository.save(Telefono.builder()
                        .minutos(minutos)
                        .descripcion(descripcion)
                        .proveedor(proveedor)
                        .activo(Boolean.TRUE)
                        .build()));
    }

    private Integer obtenerVelocidadInternet(Internet internet) {
        return internet == null ? null : internet.getVelocidad();
    }

    private String obtenerNombreTelevision(Television television) {
        return television == null ? null : television.getNombre();
    }

    private String obtenerDescripcionTelefono(Telefono telefono) {
        return telefono == null ? null : telefono.getDescripcion();
    }
}
