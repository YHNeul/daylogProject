package com.yhn.daylog.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
@Profile("test")
public class MockEmailConfig {

  @Bean
  @Primary
  public JavaMailSender javaMailSender() {
    // 테스트 환경에서는 실제 메일을 보내지 않도록 Mock 구현체 사용
    return new JavaMailSenderImpl();
  }
}