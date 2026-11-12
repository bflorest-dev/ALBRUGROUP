package pe.albrugroup.lead_service.entity.enums;

import lombok.Getter;

@Getter
public enum ColumnaUniversal {

    // ── Lead ──
    TELEFONO("Teléfono", Fuente.LEAD, "l.lead"),
    PREFIJO("Prefijo", Fuente.LEAD, "l.prefijo"),
    USERMETA("Usermeta", Fuente.LEAD, "l.usermeta"),
    ETAPA("Etapa", Fuente.LEAD, "l.etapa"),
    ESTADO("Estado seguimiento", Fuente.LEAD, "l.estado"),
    ASESOR("Asesor asignado", Fuente.LEAD, "l.nombreAsesorAsignado"),
    ID_EQUIPO("ID equipo", Fuente.LEAD, "l.idEquipo"),
    TIPIFICACION("Tipificación", Fuente.LEAD, "l.codigoTipificacion"),
    SUBTIPIFICACION("Subtipificación", Fuente.LEAD, "l.codigoSubtipificacion"),
    SEC("SEC", Fuente.LEAD, "l.sec"),
    SOT("SOT", Fuente.LEAD, "l.sot"),
    CUSTOMER_ID("Customer ID", Fuente.LEAD, "l.customerId"),
    COMENTARIO("Comentario", Fuente.LEAD, "l.comentario"),
    PRECIO_PLAN("Precio plan", Fuente.LEAD, "l.precioPlanSnapshot"),
    PRECIO_FINAL("Precio final", Fuente.LEAD, "l.precioFinal"),
    DIA_CORTE("Día corte", Fuente.LEAD, "l.diaCorteFacturacion"),
    ESTADO_CLIENTE_PV("Estado cliente PV", Fuente.LEAD, "l.estadoClientePostventa"),
    ES_FULL_CLARO("Full Claro", Fuente.LEAD, "l.esFullClaro"),
    TECNOLOGIA("Tecnología", Fuente.LEAD, "l.tecnologia"),
    ES_JALA_COBERTURA("Jala cobertura", Fuente.LEAD, "l.esJalaCobertura"),
    ES_ZONA_PINTADA("Zona pintada", Fuente.LEAD, "l.esZonaPintada"),
    ES_DERIVADO("Derivado", Fuente.LEAD, "l.esDerivado"),
    CREATED_AT("Creado", Fuente.LEAD, "l.createdAt"),
    LAST_ENTRY_AT("Último ingreso", Fuente.LEAD, "l.lastEntryAt"),

    // ── Proveedor / Origen ──
    PROVEEDOR("Proveedor", Fuente.PROVEEDOR, "prov.nombre"),
    PROVEEDOR_ORIGEN("Proveedor origen", Fuente.PROVEEDOR_ORIGEN, "provOrigen.nombre"),
    CAMPANA("Campaña", Fuente.CAMPANA, "camp.nombre"),
    ORIGEN("Origen", Fuente.ORIGEN, "orig.nombre"),
    PLAN("Plan", Fuente.PLAN, "pl.nombre"),
    ZONA("Zona", Fuente.ZONA, "z.nombre"),

    // ── Contacto ──
    CONTACTO_NOMBRE("Nombre conocido", Fuente.CONTACTO, "c.nombreConocido"),

    // ── Datos preventa ──
    TIPO_DOCUMENTO("Tipo documento", Fuente.DATOS_PREVENTA, "dp.tipoDocumento"),
    DOCUMENTO("N° documento", Fuente.DATOS_PREVENTA, "dp.numeroDocumentoTitularServicio"),
    NOMBRE_TITULAR("Nombre titular", Fuente.DATOS_PREVENTA, "dp.nombreTitularServicio"),
    CELULAR_REGISTRO("Celular registro", Fuente.DATOS_PREVENTA, "dp.celularRegistro"),
    CELULAR_REFERENCIA("Celular referencia", Fuente.DATOS_PREVENTA, "dp.celularReferencia"),
    CORREO("Correo", Fuente.DATOS_PREVENTA, "dp.correo"),
    PARENTESCO("Parentesco", Fuente.DATOS_PREVENTA, "dp.parentesco"),
    FECHA_NACIMIENTO("Fecha nacimiento", Fuente.DATOS_PREVENTA, "dp.fechaNacimiento"),

    // ── Dirección ──
    DIRECCION("Dirección", Fuente.DIRECCION, "dir.direccion"),
    UBIGEO("Ubigeo domicilio", Fuente.DIRECCION, "dir.ubigeoDomicilio"),
    LATITUD("Latitud", Fuente.DIRECCION, "dir.latitud"),
    LONGITUD("Longitud", Fuente.DIRECCION, "dir.longitud"),
    REFERENCIA_DIR("Referencia", Fuente.DIRECCION, "dir.referencia"),

    // ── Seguimiento ──
    FECHA_AGENDAMIENTO("Agendamiento PV", Fuente.SEGUIMIENTO, "seg.fechaAgendamientoPreventa"),
    FECHA_REGISTRO_CRM("Registro CRM", Fuente.SEGUIMIENTO, "seg.fechaRegistroCrm"),
    FECHA_GRABACION("Grabación", Fuente.SEGUIMIENTO, "seg.fechaGrabacion"),
    FECHA_PROGRAMACION("Programación", Fuente.SEGUIMIENTO, "seg.fechaProgramacion"),
    FECHA_INSTALACION("Instalación", Fuente.SEGUIMIENTO, "seg.fechaInstalacion"),
    FECHA_SUSPENSION("Suspensión", Fuente.SEGUIMIENTO, "seg.fechaSuspension"),
    FECHA_BAJA("Baja", Fuente.SEGUIMIENTO, "seg.fechaBaja"),

    // ── Etapa resumen (etapa actual) ──
    FECHA_INGRESO_ETAPA("Ingreso etapa", Fuente.ETAPA_RESUMEN, "er.fechaIngresoEtapa"),
    TOTAL_TIPIFICACIONES("Total tipificaciones", Fuente.ETAPA_RESUMEN, "er.totalTipificaciones"),
    TOTAL_ASIGNACIONES("Total asignaciones", Fuente.ETAPA_RESUMEN, "er.totalAsignaciones"),
    ASESOR_MERITO("Asesor mérito", Fuente.ETAPA_RESUMEN, "er.nombreAsesorMerito"),
    ULTIMA_COD_TIPIFICACION("Última tipificación", Fuente.ETAPA_RESUMEN, "er.ultimaCodigoTipificacion"),
    ULTIMA_TIPIFICACION_AT("Fecha última tip.", Fuente.ETAPA_RESUMEN, "er.ultimaTipificacionAt"),

    // ── Calendario facturación ──
    CAL_DIA_CORTE("Día corte fact.", Fuente.CALENDARIO, "cal.diaCorte"),
    CAL_DIA_EMISION("Día emisión", Fuente.CALENDARIO, "cal.diaEmisionEstimado"),
    CAL_DIA_VENCIMIENTO("Día vencimiento", Fuente.CALENDARIO, "cal.diaVencimiento"),
    CAL_BLOQUE("Bloque facturación", Fuente.CALENDARIO, "cal.bloqueFacturacion"),
    CAL_ACTIVO("Calendario activo", Fuente.CALENDARIO, "cal.activo");

    private final String label;
    private final Fuente fuente;
    private final String jpql;

    ColumnaUniversal(String label, Fuente fuente, String jpql) {
        this.label = label;
        this.fuente = fuente;
        this.jpql = jpql;
    }

    public enum Fuente {
        LEAD("Lead"),
        CONTACTO("Contacto"),
        DATOS_PREVENTA("Datos preventa"),
        DIRECCION("Dirección"),
        PROVEEDOR("Proveedor"),
        PROVEEDOR_ORIGEN("Proveedor origen"),
        CAMPANA("Campaña"),
        ORIGEN("Origen"),
        PLAN("Plan"),
        ZONA("Zona"),
        SEGUIMIENTO("Seguimiento"),
        ETAPA_RESUMEN("Etapa resumen"),
        CALENDARIO("Calendario facturación");

        @Getter
        private final String label;

        Fuente(String label) {
            this.label = label;
        }
    }
}
