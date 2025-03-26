package com.yhn.daylog.dto;

import com.yhn.daylog.model.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
  private Long id;
  private String name;
  private Boolean visible;  // color 대신 visible

  public static CategoryDTO fromEntity(Category category) {
    if (category == null) {
      return null;
    }

    return CategoryDTO.builder()
        .id(category.getId())
        .name(category.getName())
        .visible(category.getVisible())
        .build();
  }
}