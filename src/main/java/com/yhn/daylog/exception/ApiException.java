package com.yhn.daylog.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {

  private final HttpStatus status;
  private final String message;

  public ApiException(HttpStatus status, String message) {
    super(message);
    this.status = status;
    this.message = message;
  }

  public ApiException(String message, HttpStatus status, Throwable cause) {
    super(message, cause);
    this.status = status;
    this.message = message;
  }
}