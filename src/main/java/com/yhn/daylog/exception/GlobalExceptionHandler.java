package com.yhn.daylog.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiErrorResponse> handleApiException(ApiException ex,
      HttpServletRequest request) {
    log.error("API Exception: {}", ex.getMessage());

    ApiErrorResponse errorResponse = ApiErrorResponse.builder()
        .status(ex.getStatus())
        .statusCode(ex.getStatus().value())
        .message(ex.getMessage())
        .path(request.getRequestURI())
        .timestamp(LocalDateTime.now())
        .build();

    return new ResponseEntity<>(errorResponse, ex.getStatus());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleValidationExceptions(
      MethodArgumentNotValidException ex, HttpServletRequest request) {
    log.error("Validation Exception: {}", ex.getMessage());

    List<ApiErrorResponse.ValidationError> validationErrors = new ArrayList<>();
    ex.getBindingResult().getAllErrors().forEach(error -> {
      String fieldName = ((FieldError) error).getField();
      String errorMessage = error.getDefaultMessage();
      validationErrors.add(ApiErrorResponse.ValidationError.builder()
          .field(fieldName)
          .message(errorMessage)
          .build());
    });

    ApiErrorResponse errorResponse = ApiErrorResponse.builder()
        .status(HttpStatus.BAD_REQUEST)
        .statusCode(HttpStatus.BAD_REQUEST.value())
        .message("입력값 검증에 실패했습니다")
        .path(request.getRequestURI())
        .timestamp(LocalDateTime.now())
        .errors(validationErrors)
        .build();

    return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
  }

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ApiErrorResponse> handleBadCredentialsException(
      BadCredentialsException ex, HttpServletRequest request) {
    log.error("Authentication Exception: {}", ex.getMessage());

    ApiErrorResponse errorResponse = ApiErrorResponse.builder()
        .status(HttpStatus.UNAUTHORIZED)
        .statusCode(HttpStatus.UNAUTHORIZED.value())
        .message("아이디 또는 비밀번호가 올바르지 않습니다")
        .path(request.getRequestURI())
        .timestamp(LocalDateTime.now())
        .build();

    return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorResponse> handleAllExceptions(Exception ex,
      HttpServletRequest request) {
    log.error("Unexpected Exception: ", ex);

    ApiErrorResponse errorResponse = ApiErrorResponse.builder()
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .statusCode(HttpStatus.INTERNAL_SERVER_ERROR.value())
        .message("서버 내부 오류가 발생했습니다")
        .path(request.getRequestURI())
        .timestamp(LocalDateTime.now())
        .build();

    return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}