package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import pe.albrugroup.recruitment_service.entity.Postulacion;

public interface PostulacionRepository extends JpaRepository<Postulacion, Long>, JpaSpecificationExecutor<Postulacion> {
}
