package com.yhn.daylog.service;

import com.yhn.daylog.dto.AuthenticationDTO;
import com.yhn.daylog.dto.AuthenticationDTO;
import com.yhn.daylog.model.User;
import com.yhn.daylog.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;

@SpringBootTest
@ActiveProfiles("test")
public class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        doNothing().when(emailService).sendVerificationEmail(any(User.class));
        doNothing().when(emailService).sendPasswordResetEmail(any(User.class));
    }

    @Test
    public void testRegisterUser() {
        // Given
        AuthenticationDTO.SignupRequest signupRequest = new AuthenticationDTO.SignupRequest();
        signupRequest.setEmail("test@example.com");
        signupRequest.setPassword("password123");
        signupRequest.setName("Test User");

        // When
        User savedUser = authService.registerUser(signupRequest);

        // Then
        assertNotNull(savedUser);
        assertEquals(signupRequest.getEmail(), savedUser.getEmail());
        assertEquals(signupRequest.getName(), savedUser.getName());
        assertFalse(savedUser.getEmailVerified());
        assertNotNull(savedUser.getVerificationToken());
        assertTrue(passwordEncoder.matches(signupRequest.getPassword(), savedUser.getPassword()));
    }

    @Test
    public void testVerifyEmail() {
        // Given
        String token = UUID.randomUUID().toString();

        User user = User.builder()
                .email("test@example.com")
                .password(passwordEncoder.encode("password123"))
                .name("Test User")
                .emailVerified(false)
                .verificationToken(token)
                .build();

        userRepository.save(user);

        // When
        authService.verifyEmail(token);

        // Then
        Optional<User> verifiedUser = userRepository.findByEmail("test@example.com");
        assertTrue(verifiedUser.isPresent());
        assertTrue(verifiedUser.get().getEmailVerified());
        assertNull(verifiedUser.get().getVerificationToken());
    }

    @Test
    public void testResetPassword() {
        // Given
        String token = UUID.randomUUID().toString();

        User user = User.builder()
                .email("test@example.com")
                .password(passwordEncoder.encode("oldpassword"))
                .name("Test User")
                .emailVerified(true)
                .passwordResetToken(token)
                .passwordResetExpires(LocalDateTime.now().plusHours(1))
                .build();

        userRepository.save(user);

        AuthenticationDTO.ResetPasswordRequest resetPasswordRequest = new AuthenticationDTO.ResetPasswordRequest();
        resetPasswordRequest.setToken(token);
        resetPasswordRequest.setPassword("newpassword123");

        // When
        authService.resetPassword(resetPasswordRequest);

        // Then
        Optional<User> updatedUser = userRepository.findByEmail("test@example.com");
        assertTrue(updatedUser.isPresent());
        assertTrue(passwordEncoder.matches("newpassword123", updatedUser.get().getPassword()));
        assertNull(updatedUser.get().getPasswordResetToken());
        assertNull(updatedUser.get().getPasswordResetExpires());
    }
}