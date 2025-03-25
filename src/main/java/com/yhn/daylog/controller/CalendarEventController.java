package com.yhn.daylog.controller;

import com.yhn.daylog.dto.CalendarEventDTO;
import com.yhn.daylog.model.CalendarEvent;
import com.yhn.daylog.service.CalendarEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
public class CalendarEventController {

    @Autowired
    private CalendarEventService eventService;

    @GetMapping
    public ResponseEntity<List<CalendarEventDTO>> getAllEvents(Authentication authentication) {
        List<CalendarEvent> events = eventService.getAllEventsByUser(authentication.getName());
        List<CalendarEventDTO> eventDTOs = events.stream()
                .map(CalendarEventDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(eventDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CalendarEventDTO> getEventById(@PathVariable Long id, Authentication authentication) {
        CalendarEvent event = eventService.getEventById(id, authentication.getName());
        return ResponseEntity.ok(CalendarEventDTO.fromEntity(event));
    }

    @PostMapping
    public ResponseEntity<CalendarEventDTO> createEvent(@RequestBody CalendarEvent event, Authentication authentication) {
        CalendarEvent newEvent = eventService.createEvent(event, authentication.getName());
        return ResponseEntity.ok(CalendarEventDTO.fromEntity(newEvent));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalendarEventDTO> updateEvent(
            @PathVariable Long id,
            @RequestBody CalendarEvent eventDetails,
            Authentication authentication) {
        CalendarEvent updatedEvent = eventService.updateEvent(id, eventDetails, authentication.getName());
        return ResponseEntity.ok(CalendarEventDTO.fromEntity(updatedEvent));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id, Authentication authentication) {
        eventService.deleteEvent(id, authentication.getName());
        return ResponseEntity.ok().build();
    }
}