package com.pos.saas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.data.jpa.repository.config.EnableJpaAuditing
public class SaasApplication {

	public static void main(String[] args) {
		SpringApplication.run(SaasApplication.class, args);
	}

}
