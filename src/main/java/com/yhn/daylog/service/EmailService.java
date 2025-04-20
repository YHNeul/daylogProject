package com.yhn.daylog.service;

import com.yhn.daylog.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

  private final JavaMailSender mailSender;
  private final String apiBaseUrl = "http://localhost:8083"; // 백엔드 URL
  private final String clientBaseUrl = "http://localhost:3000"; // 프론트엔드 URL

  public void sendVerificationEmail(User user) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setTo(user.getEmail());
    message.setSubject("Daylog - 이메일 인증");
    message.setText("안녕하세요, " + user.getName() + "님!\n\n" +
        "Daylog 계정을 인증하려면 아래 링크를 클릭해주세요:\n\n" +
        clientBaseUrl + "/verify-email?token=" + user.getVerificationToken() + "\n\n" +
        "감사합니다,\nDaylog 팀");

    mailSender.send(message);
  }

  public void sendPasswordResetEmail(User user) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setTo(user.getEmail());
    message.setSubject("Daylog - 비밀번호 재설정");
    message.setText("안녕하세요, " + user.getName() + "님!\n\n" +
        "비밀번호를 재설정하려면 아래 링크를 클릭해주세요:\n\n" +
        clientBaseUrl + "/reset-password?token=" + user.getPasswordResetToken() + "\n\n" +
        "이 링크는 1시간 후 만료됩니다.\n" +
        "비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.\n\n" +
        "감사합니다,\nDaylog 팀");

    mailSender.send(message);
  }
}