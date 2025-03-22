package com.yhn.daylog.controller;

import com.yhn.daylog.model.CalendarEvent;
import com.yhn.daylog.service.CalendarEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/events")
public class CalendarEventController {

    @Autowired
    private CalendarEventService eventService;

    @GetMapping
    public ResponseEntity<List<CalendarEvent>> getAllEvents(Authentication authentication) {
        List<CalendarEvent> events = eventService.getAllEventsByUser(authentication.getName());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/range")
    public ResponseEntity<List<CalendarEvent>> getEventsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            Authentication authentication) {
        List<CalendarEvent> events = eventService.getEventsByDateRange(start, end, authentication.getName());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CalendarEvent> getEventById(@PathVariable Long id, Authentication authentication) {
        CalendarEvent event = eventService.getEventById(id, authentication.getName());
        return ResponseEntity.ok(event);
    }

    @PostMapping
    public ResponseEntity<CalendarEvent> createEvent(@RequestBody CalendarEvent event, Authentication authentication) {
        CalendarEvent newEvent = eventService.createEvent(event, authentication.getName());
        return ResponseEntity.ok(newEvent);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalendarEvent> updateEvent(
            @PathVariable Long id,
            @RequestBody CalendarEvent eventDetails,
            Authentication authentication) {
        CalendarEvent updatedEvent = eventService.updateEvent(id, eventDetails, authentication.getName());
        return ResponseEntity.ok(updatedEvent);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id, Authentication authentication) {
        eventService.deleteEvent(id, authentication.getName());
        return ResponseEntity.ok().build();
    }
}