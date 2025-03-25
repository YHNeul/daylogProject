package com.yhn.daylog.dto;

import com.yhn.daylog.model.CalendarEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDTO {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean allDay;
    private CategoryDTO category;

    public static CalendarEventDTO fromEntity(CalendarEvent event) {
        if (event == null) {
            return null;
        }

        return CalendarEventDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .allDay(event.getAllDay())
                .category(CategoryDTO.fromEntity(event.getCategory()))
                .build();
    }
}