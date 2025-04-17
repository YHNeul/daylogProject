package com.yhn.daylog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // 업로드된 이미지 파일에 접근할 수 있도록 설정
    registry.addResourceHandler("/uploads/**")
        .addResourceLocations("file:uploads/")
        .setCachePeriod(3600)
        .resourceChain(true);
  }
}