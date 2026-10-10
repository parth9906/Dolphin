package com.school.dolphin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@ConfigurationPropertiesScan
@SpringBootApplication
public class DolphinApplication {

	public static void main(String[] args) {
		SpringApplication.run(DolphinApplication.class, args);
	}

}
