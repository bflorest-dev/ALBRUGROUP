package pe.albrugroup.lead_service.entity.enums;

import lombok.Getter;

/**
 * Catálogo de campos de captura (DatosPreventa/Direccion) cuya visibilidad y obligatoriedad puede
 * variar por equipo. Solo se listan los campos CONFIGURABLES: los campos núcleo (documento, titular
 * del servicio, celular, correo, distrito, dirección, referencia...) van siempre visibles/obligatorios
 * y no entran aquí, para que un equipo no pueda ocultarlos por error.
 *
 * Un campo físicamente nuevo requiere además su columna en la entidad y su control en el formulario;
 * una vez existe, basta sumarlo a este enum para volverlo configurable por equipo.
 */
@Getter
public enum CampoConfigurable {

    NOMBRE_MADRE(Tab.DATOS, "Nombre de la madre"),
    NOMBRE_PADRE(Tab.DATOS, "Nombre del padre"),
    DOC_TITULAR_CELULAR(Tab.DATOS, "Documento del titular del celular"),
    NOMBRE_TITULAR_CELULAR(Tab.DATOS, "Nombre del titular del celular"),
    PLANO(Tab.DIRECCION, "Plano");

    /** Pestaña del modal donde vive el campo. */
    public enum Tab { DATOS, DIRECCION }

    private final Tab tab;
    private final String descripcion;

    CampoConfigurable(Tab tab, String descripcion) {
        this.tab = tab;
        this.descripcion = descripcion;
    }
}
