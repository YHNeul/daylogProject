package com.yhn.daylog.service;

import com.yhn.daylog.model.Category;
import com.yhn.daylog.model.User;
import com.yhn.daylog.repository.CategoryRepository;
import com.yhn.daylog.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

  @Autowired
  private CategoryRepository categoryRepository;

  @Autowired
  private UserRepository userRepository;

  public List<Category> getAllCategoriesByUser(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    List<Category> categories = categoryRepository.findByUser(user);

    // 카테고리가 없으면 기본 카테고리 생성
    if (categories.isEmpty()) {
      Category defaultCategory = new Category();
      defaultCategory.setName("개인");
      defaultCategory.setVisible(true);
      defaultCategory.setUser(user);
      defaultCategory = categoryRepository.save(defaultCategory);
      categories.add(defaultCategory);
    }

    return categories;
  }

  public Category getCategoryById(Long id, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    return categoryRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
  }

  @Transactional
  public Category updateCategoryVisibility(Long id, Boolean visible, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    Category category = categoryRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

    category.setVisible(visible);
    return categoryRepository.save(category);
  }

  @Transactional
  public Category createCategory(Category category, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    category.setUser(user);
    category.setVisible(true); // 기본적으로 보이게 설정
    return categoryRepository.save(category);
  }

  @Transactional
  public Category updateCategory(Long id, Category categoryDetails, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    Category category = categoryRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

    category.setName(categoryDetails.getName());

    // 가시성이 제공되면 업데이트
    if (categoryDetails.getVisible() != null) {
      category.setVisible(categoryDetails.getVisible());
    }

    return categoryRepository.save(category);
  }

  @Transactional
  public void deleteCategory(Long id, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

    Category category = categoryRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

    categoryRepository.delete(category);
  }
}