package pe.albrugroup.lead_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import pe.albrugroup.lead_service.security.JWTUtil;

@ActiveProfiles("test")
@SpringBootTest(properties = {
		"spring.cache.type=simple",
		"spring.flyway.enabled=false"
})
class LeadServiceApplicationTests {

	@MockitoBean
	private JWTUtil jwtUtil;

	@Test
	void contextLoads() {
	}

}
