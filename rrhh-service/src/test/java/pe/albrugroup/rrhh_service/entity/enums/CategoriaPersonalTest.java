package pe.albrugroup.rrhh_service.entity.enums;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CategoriaPersonalTest {

    @Test
    void clasificaPuestosAdministrativosComoEstructurales() {
        assertThat(CategoriaPersonal.desdePuestoTrabajo(PuestoTrabajo.ADMINISTRADOR))
                .isEqualTo(CategoriaPersonal.ESTRUCTURAL);
        assertThat(CategoriaPersonal.desdePuestoTrabajo(PuestoTrabajo.RRHH))
                .isEqualTo(CategoriaPersonal.ESTRUCTURAL);
        assertThat(CategoriaPersonal.desdePuestoTrabajo(PuestoTrabajo.CONTADOR))
                .isEqualTo(CategoriaPersonal.ESTRUCTURAL);
    }

    @Test
    void clasificaPuestosDeOperacionComoOperativos() {
        assertThat(CategoriaPersonal.desdePuestoTrabajo(PuestoTrabajo.ASESOR_VENTAS))
                .isEqualTo(CategoriaPersonal.OPERATIVO);
        assertThat(CategoriaPersonal.desdePuestoTrabajo(PuestoTrabajo.SUPERVISOR_BACKOFFICE))
                .isEqualTo(CategoriaPersonal.OPERATIVO);
        assertThat(CategoriaPersonal.desdePuestoTrabajo(PuestoTrabajo.OJT))
                .isEqualTo(CategoriaPersonal.OPERATIVO);
    }

    @Test
    void noInventaCategoriaCuandoNoExistePuestoLegado() {
        assertThat(CategoriaPersonal.desdePuestoTrabajo(null)).isNull();
    }
}
