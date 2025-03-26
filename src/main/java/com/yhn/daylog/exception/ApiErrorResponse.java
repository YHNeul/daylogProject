package com.yhn.daylog.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Builder;
import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ApiErrorResponse {

  private HttpStatus status;
  private int statusCode;
  private String message;
  private String path;

  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
  private LocalDateTime timestamp;

  private List<ValidationError> errors;

  @Getter
  @Builder
  public static class ValidationError {

    private String field;
    private String message;
  }
}