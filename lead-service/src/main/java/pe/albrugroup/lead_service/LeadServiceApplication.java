package pe.albrugroup.lead_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
public class LeadServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(LeadServiceApplication.class, args);
	}

}
