package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import pe.albrugroup.schedule_service.entity.enums.Dia;

public class Turno {

    private Long  id;
    private Long idEmpleado;
    @Enumerated(EnumType.STRING)
    private Dia dia;
    private
}
