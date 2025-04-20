package com.yhn.daylog.service;

import com.yhn.daylog.dto.AuthenticationDTO;
import com.yhn.daylog.dto.AuthenticationDTO;
import com.yhn.daylog.model.Category;
import com.yhn.daylog.model.User;
import com.yhn.daylog.repository.CategoryRepository;
import com.yhn.daylog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final EmailService emailService;

  @Autowired
  private CategoryRepository categoryRepository;

  @Transactional
  public User registerUser(AuthenticationDTO.SignupRequest signupRequest) {
    if (userRepository.existsByEmail(signupRequest.getEmail())) {
      throw new RuntimeException("이미 사용 중인 이메일입니다");
    }

    String verificationToken = UUID.randomUUID().toString();

    User user = User.builder()
        .email(signupRequest.getEmail())
        .password(passwordEncoder.encode(signupRequest.getPassword()))
        .name(signupRequest.getName())
        .emailVerified(false)
        .verificationToken(verificationToken)
        .build();

    User savedUser = userRepository.save(user);

    // 기본 카테고리 생성
    Category defaultCategory = new Category();
    defaultCategory.setName("개인");
    defaultCategory.setUser(savedUser);
    defaultCategory.setVisible(true);
    categoryRepository.save(defaultCategory);

    // 이메일 인증 메일 발송
    emailService.sendVerificationEmail(user);

    return savedUser;
  }

  @Transactional(readOnly = true)
  public void authenticateUser(AuthenticationDTO.LoginRequest loginRequest) {
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            loginRequest.getEmail(),
            loginRequest.getPassword()
        )
    );

    SecurityContextHolder.getContext().setAuthentication(authentication);
  }

  @Transactional
  public void verifyEmail(String token) {
    User user = userRepository.findByVerificationToken(token)
        .orElseThrow(() -> new RuntimeException("유효하지 않은 인증 토큰입니다"));

    user.setEmailVerified(true);
    user.setVerificationToken(null);
    userRepository.save(user);
  }

  @Transactional
  public void sendPasswordResetEmail(
      AuthenticationDTO.ForgotPasswordRequest forgotPasswordRequest) {
    User user = userRepository.findByEmail(forgotPasswordRequest.getEmail())
        .orElseThrow(() -> new RuntimeException("해당 이메일로 등록된 계정이 없습니다"));

    String resetToken = UUID.randomUUID().toString();
    user.setPasswordResetToken(resetToken);
    user.setPasswordResetExpires(LocalDateTime.now().plusHours(1)); // 1시간 후 만료
    userRepository.save(user);

    // 비밀번호 재설정 이메일 발송
    emailService.sendPasswordResetEmail(user);
  }

  @Transactional
  public void resetPassword(AuthenticationDTO.ResetPasswordRequest resetPasswordRequest) {
    User user = userRepository.findByPasswordResetToken(resetPasswordRequest.getToken())
        .orElseThrow(() -> new RuntimeException("유효하지 않은 재설정 토큰입니다"));

    // 토큰 만료 여부 확인
    if (user.getPasswordResetExpires().isBefore(LocalDateTime.now())) {
      throw new RuntimeException("만료된 토큰입니다. 다시 비밀번호 재설정을 요청해주세요");
    }

    user.setPassword(passwordEncoder.encode(resetPasswordRequest.getPassword()));
    user.setPasswordResetToken(null);
    user.setPasswordResetExpires(null);
    userRepository.save(user);
  }
}