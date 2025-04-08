package com.yhn.daylog.dto;

import com.yhn.daylog.model.Category;
import com.yhn.daylog.model.Todo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodoDTO {
  private Long id;
  private String title;
  private String description;
  private Integer progress;
  private Boolean completed;
  private Boolean showInCalendar;
  private LocalDateTime dueDate;
  private String color;
  private CategoryDTO category;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public static TodoDTO fromEntity(Todo todo) {
    CategoryDTO categoryDTO = null;
    if (todo.getCategory() != null) {
      categoryDTO = CategoryDTO.fromEntity(todo.getCategory());
    }

    return TodoDTO.builder()
        .id(todo.getId())
        .title(todo.getTitle())
        .description(todo.getDescription())
        .progress(todo.getProgress())
        .completed(todo.getCompleted())
        .showInCalendar(todo.getShowInCalendar())
        .dueDate(todo.getDueDate())
        .color(todo.getColor())
        .category(categoryDTO)
        .createdAt(todo.getCreatedAt())
        .updatedAt(todo.getUpdatedAt())
        .build();
  }
}