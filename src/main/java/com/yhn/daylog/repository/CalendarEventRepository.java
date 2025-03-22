package com.yhn.daylog.repository;

import com.yhn.daylog.model.CalendarEvent;
import com.yhn.daylog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByUser(User user);
    List<CalendarEvent> findByUserAndStartTimeBetween(User user, LocalDateTime start, LocalDateTime end);
    Optional<CalendarEvent> findByIdAndUser(Long id, User user);
}