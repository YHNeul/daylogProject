package com.yhn.daylog.dto;

import com.yhn.daylog.model.CalendarEvent;
import com.yhn.daylog.model.Diary;
import com.yhn.daylog.model.DiaryRelation;
import com.yhn.daylog.model.Todo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiaryDTO {

  private Long id;
  private String title;
  private String content;
  private LocalDateTime date;
  private String imageUrl;
  private List<CalendarEventDTO> relatedEvents;
  private List<TodoDTO> relatedTodos;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public static DiaryDTO fromEntity(Diary diary) {
    List<CalendarEventDTO> events = new ArrayList<>();
    List<TodoDTO> todos = new ArrayList<>();

    // 관련 일정 및 할일 처리
    if (diary.getRelations() != null) {
      for (DiaryRelation relation : diary.getRelations()) {
        if (relation.getRelationType() == DiaryRelation.RelationType.EVENT && relation.getCalendarEvent() != null) {
          events.add(CalendarEventDTO.fromEntity(relation.getCalendarEvent()));
        } else if (relation.getRelationType() == DiaryRelation.RelationType.TODO && relation.getTodoItem() != null) {
          todos.add(TodoDTO.fromEntity(relation.getTodoItem()));
        }
      }
    }

    return DiaryDTO.builder()
        .id(diary.getId())
        .title(diary.getTitle())
        .content(diary.getContent())
        .date(diary.getDate())
        .imageUrl(diary.getImageUrl())
        .relatedEvents(events)
        .relatedTodos(todos)
        .createdAt(diary.getCreatedAt())
        .updatedAt(diary.getUpdatedAt())
        .build();
  }

  public static List<DiaryDTO> fromEntities(List<Diary> diaries) {
    return diaries.stream()
        .map(DiaryDTO::fromEntity)
        .collect(Collectors.toList());
  }
}