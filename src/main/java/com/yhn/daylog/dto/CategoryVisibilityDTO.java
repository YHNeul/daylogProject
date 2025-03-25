package com.yhn.daylog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryVisibilityDTO {
    private Long id;
    private Long categoryId;
    private String categoryName;
    private Boolean visible;
}