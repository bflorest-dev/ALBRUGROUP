package pe.albrugroup.auth_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import pe.albrugroup.auth_service.security.JWTUtil;

@SpringBootTest
class AuthServiceApplicationTests {

	@MockitoBean
	private JWTUtil jwtUtil;

	@Test
	void contextLoads() {
	}

}
