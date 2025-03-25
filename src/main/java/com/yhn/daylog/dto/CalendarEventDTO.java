package com.yhn.daylog.dto;

import com.yhn.daylog.model.CalendarEvent;
import com.yhn.daylog.model.Category;
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
    private String color;
    private Category category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CalendarEventDTO fromEntity(CalendarEvent event) {
        Category category = null;

        // 카테고리가 있을 경우 필요한 정보만 추출
        if (event.getCategory() != null) {
            category = new Category();
            category.setId(event.getCategory().getId());
            category.setName(event.getCategory().getName());
            category.setColor(event.getCategory().getColor());
        }
        return CalendarEventDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .allDay(event.getAllDay())
                .color(event.getColor())
                .category(category)
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}