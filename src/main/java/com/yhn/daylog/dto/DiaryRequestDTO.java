package com.yhn.daylog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiaryRequestDTO {

  private String title;
  private String content;
  private LocalDateTime date;
  private List<Long> relatedEvents; // 관련 일정 ID 목록
  private List<Long> relatedTodos;  // 관련 할일 ID 목록
  private Boolean removeImage;      // 이미지 삭제 여부
}