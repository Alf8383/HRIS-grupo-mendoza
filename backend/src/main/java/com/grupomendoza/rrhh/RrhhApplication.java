package com.grupomendoza.rrhh;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class RrhhApplication {

	public static void main(String[] args) {
		SpringApplication.run(RrhhApplication.class, args);
	}

}
