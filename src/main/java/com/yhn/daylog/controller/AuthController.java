package com.yhn.daylog.controller;

import com.yhn.daylog.dto.AuthenticationDTO;
import com.yhn.daylog.security.JwtUtils;
import com.yhn.daylog.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  @Autowired
  private AuthService authService;

  @Autowired
  private AuthenticationManager authenticationManager;

  @Autowired
  private JwtUtils jwtUtils;

  @PostMapping("/signup")
  public ResponseEntity<?> registerUser(
      @Valid @RequestBody AuthenticationDTO.SignupRequest signupRequest) {
    authService.registerUser(signupRequest);

    URI location = ServletUriComponentsBuilder
        .fromCurrentContextPath().path("/api/users/me")
        .build().toUri();

    Map<String, String> response = new HashMap<>();
    response.put("message", "회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.");

    return ResponseEntity.created(location).body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<?> authenticateUser(
      @Valid @RequestBody AuthenticationDTO.LoginRequest loginRequest) {
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            loginRequest.getEmail(),
            loginRequest.getPassword()
        )
    );

    SecurityContextHolder.getContext().setAuthentication(authentication);
    String jwt = jwtUtils.generateJwtToken(authentication);

    AuthenticationDTO.TokenResponse tokenResponse = new AuthenticationDTO.TokenResponse(jwt,
        "Bearer", 86400000L);
    return ResponseEntity.ok(tokenResponse);
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout(HttpServletRequest request) {
    HttpSession session = request.getSession(false);
    if (session != null) {
      session.invalidate();
    }

    Map<String, String> response = new HashMap<>();
    response.put("message", "로그아웃이 성공적으로 완료되었습니다.");

    return ResponseEntity.ok(response);
  }

  @GetMapping("/verify-email")
  public ResponseEntity<?> verifyEmail(@RequestParam String token) {
    authService.verifyEmail(token);

    Map<String, String> response = new HashMap<>();
    response.put("message", "이메일 인증이 완료되었습니다.");

    return ResponseEntity.ok(response);
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(
      @Valid @RequestBody AuthenticationDTO.ForgotPasswordRequest forgotPasswordRequest) {
    authService.sendPasswordResetEmail(forgotPasswordRequest);

    Map<String, String> response = new HashMap<>();
    response.put("message", "비밀번호 재설정 이메일을 발송했습니다.");

    return ResponseEntity.ok(response);
  }

  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(
      @Valid @RequestBody AuthenticationDTO.ResetPasswordRequest resetPasswordRequest) {
    authService.resetPassword(resetPasswordRequest);

    Map<String, String> response = new HashMap<>();
    response.put("message", "비밀번호가 성공적으로 재설정되었습니다.");

    return ResponseEntity.ok(response);
  }
}