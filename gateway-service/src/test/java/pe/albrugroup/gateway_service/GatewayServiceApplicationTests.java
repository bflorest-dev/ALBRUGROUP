package pe.albrugroup.gateway_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import pe.albrugroup.gateway_service.security.JwtUtil;

@ActiveProfiles("test")
@SpringBootTest
class GatewayServiceApplicationTests {

	@MockitoBean
	private JwtUtil jwtUtil;

	@Test
	void contextLoads() {
	}

}
