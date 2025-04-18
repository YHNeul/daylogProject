package com.yhn.daylog.controller;

import com.yhn.daylog.model.User;
import com.yhn.daylog.repository.UserRepository;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;


  @GetMapping("/me")
  public ResponseEntity<?> getCurrentUser(Authentication authentication) {
    if (authentication == null) {
      return ResponseEntity.status(401).body("인증되지 않은 사용자입니다");
    }

    User user = userRepository.findByEmail(authentication.getName())
        .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다"));

    // 비밀번호 필드 제외
    user.setPassword(null);

    return ResponseEntity.ok(user);
  }

  @PutMapping("/me")
  public ResponseEntity<?> updateUserInfo(
      @RequestBody Map<String, String> userInfo,
      Authentication authentication) {

    User user = userRepository.findByEmail(authentication.getName())
        .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다"));

    // 이름 업데이트
    if (userInfo.containsKey("name")) {
      user.setName(userInfo.get("name"));
    }

    // 비밀번호 업데이트 (선택적)
    if (userInfo.containsKey("password") && !userInfo.get("password").isEmpty()) {
      user.setPassword(passwordEncoder.encode(userInfo.get("password")));
    }

    userRepository.save(user);

    // 업데이트된 사용자 정보 반환 (비밀번호 제외)
    user.setPassword(null);
    return ResponseEntity.ok(user);
  }

  @DeleteMapping("/me")
  public ResponseEntity<?> deleteUser(Authentication authentication) {
    User user = userRepository.findByEmail(authentication.getName())
        .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다"));

    userRepository.delete(user);

    Map<String, String> response = new HashMap<>();
    response.put("message", "회원 탈퇴가 성공적으로 처리되었습니다.");
    return ResponseEntity.ok(response);
  }
}