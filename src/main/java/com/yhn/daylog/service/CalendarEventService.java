package com.yhn.daylog.service;

import com.yhn.daylog.model.CalendarEvent;
import com.yhn.daylog.model.Category;
import com.yhn.daylog.model.User;
import com.yhn.daylog.repository.CalendarEventRepository;
import com.yhn.daylog.repository.CategoryRepository;
import com.yhn.daylog.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CalendarEventService {

  @Autowired
  private CalendarEventRepository eventRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private CategoryRepository categoryRepository;

  public List<CalendarEvent> getAllEventsByUser(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    return eventRepository.findByUser(user);
  }

  public List<CalendarEvent> getEventsByDateRange(LocalDateTime start, LocalDateTime end,
      String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    return eventRepository.findByUserAndStartTimeBetween(user, start, end);
  }

  public CalendarEvent getEventById(Long id, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    return eventRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
  }

  @Transactional
  public CalendarEvent createEvent(CalendarEvent event, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    event.setUser(user);

    // 카테고리 처리
    if (event.getCategory() == null || event.getCategory().getId() == null) {
      // 카테고리가 없으면 '개인' 카테고리 찾기
      Category personalCategory = categoryRepository.findByNameAndUser("개인", user)
          .orElse(null);
      if (personalCategory != null) {
        event.setCategory(personalCategory);
      }
    } else {
      Category category = categoryRepository.findByIdAndUser(event.getCategory().getId(), user)
          .orElseThrow(() -> new RuntimeException("Category not found"));
      event.setCategory(category);
    }

    // 색상이 지정되지 않았으면 기본값 설정
    if (event.getColor() == null || event.getColor().isEmpty()) {
      event.setColor("#FFFFFF"); // 기본 흰색
    }

    return eventRepository.save(event);
  }

  @Transactional
  public CalendarEvent updateEvent(Long id, CalendarEvent eventDetails, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    CalendarEvent event = eventRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));

    event.setTitle(eventDetails.getTitle());
    event.setDescription(eventDetails.getDescription());
    event.setStartTime(eventDetails.getStartTime());
    event.setEndTime(eventDetails.getEndTime());
    event.setAllDay(eventDetails.getAllDay());

    // 색상 업데이트
    if (eventDetails.getColor() != null) {
      event.setColor(eventDetails.getColor());
    }

    // 카테고리 처리
    if (eventDetails.getCategory() != null && eventDetails.getCategory().getId() != null) {
      Category category = categoryRepository.findByIdAndUser(eventDetails.getCategory().getId(),
              user)
          .orElseThrow(() -> new RuntimeException("Category not found"));
      event.setCategory(category);
    } else {
      event.setCategory(null);
    }

    return eventRepository.save(event);
  }

  @Transactional
  public void deleteEvent(Long id, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    CalendarEvent event = eventRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));

    eventRepository.delete(event);
  }
}