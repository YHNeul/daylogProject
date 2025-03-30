package com.yhn.daylog.security;

import com.yhn.daylog.model.User;
import com.yhn.daylog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

  private final UserRepository userRepository;

  @Override
  @Transactional(readOnly = true)
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    // 이메일 인증 여부에 따라 로그인 허용/차단
    if (!user.getEmailVerified()) {
      throw new RuntimeException("이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.");
    }

    return new org.springframework.security.core.userdetails.User(
        user.getEmail(),
        user.getPassword(),
        user.getEmailVerified(), // 실제 이메일 인증 여부 반영
        true,
        true,
        true,
        new ArrayList<>()
    );
  }
}