package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.recruitment_service.entity.Postulante;

@Repository
public interface PostulanteRepository extends JpaRepository<Postulante,Long> {

}
