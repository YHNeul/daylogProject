package com.yhn.daylog.controller;

import com.yhn.daylog.model.Category;
import com.yhn.daylog.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

  @Autowired
  private CategoryService categoryService;

  @GetMapping
  public ResponseEntity<List<Category>> getAllCategories(Authentication authentication) {
    List<Category> categories = categoryService.getAllCategoriesByUser(authentication.getName());
    return ResponseEntity.ok(categories);
  }

  // 카테고리 가시성 업데이트 API
  @PutMapping("/{id}/visibility")
  public ResponseEntity<Category> updateCategoryVisibility(
      @PathVariable Long id,
      @RequestBody Map<String, Boolean> request,
      Authentication authentication) {
    Boolean visible = request.get("visible");
    Category updatedCategory = categoryService.updateCategoryVisibility(id, visible, authentication.getName());
    return ResponseEntity.ok(updatedCategory);
  }

  @GetMapping("/{id}")
  public ResponseEntity<Category> getCategoryById(@PathVariable Long id, Authentication authentication) {
    Category category = categoryService.getCategoryById(id, authentication.getName());
    return ResponseEntity.ok(category);
  }

  @PostMapping
  public ResponseEntity<Category> createCategory(@RequestBody Category category, Authentication authentication) {
    Category newCategory = categoryService.createCategory(category, authentication.getName());
    return ResponseEntity.ok(newCategory);
  }

  @PutMapping("/{id}")
  public ResponseEntity<Category> updateCategory(
      @PathVariable Long id,
      @RequestBody Category categoryDetails,
      Authentication authentication) {
    Category updatedCategory = categoryService.updateCategory(id, categoryDetails, authentication.getName());
    return ResponseEntity.ok(updatedCategory);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteCategory(@PathVariable Long id, Authentication authentication) {
    categoryService.deleteCategory(id, authentication.getName());
    return ResponseEntity.ok().build();
  }
}