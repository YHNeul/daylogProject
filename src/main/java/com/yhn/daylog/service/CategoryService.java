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

    @Autowired
    private CategoryVisibilityService visibilityService;

    public List<Category> getAllCategoriesByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        List<Category> categories = categoryRepository.findByUser(user);

        // 카테고리가 없으면 기본 카테고리 생성
        if (categories.isEmpty()) {
            Category defaultCategory = new Category();
            defaultCategory.setName("기본");
            defaultCategory.setColor("#3174ad"); // 기본 파란색
            defaultCategory.setUser(user);
            defaultCategory = categoryRepository.save(defaultCategory);

            // 기본 카테고리 가시성 설정
            visibilityService.createDefaultVisibilityForCategory(defaultCategory, user);

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
    public Category createCategory(Category category, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        category.setUser(user);
        Category savedCategory = categoryRepository.save(category);

        // 새 카테고리의 가시성 설정 추가
        visibilityService.createDefaultVisibilityForCategory(savedCategory, user);

        return savedCategory;
    }

    @Transactional
    public Category updateCategory(Long id, Category categoryDetails, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        Category category = categoryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        category.setName(categoryDetails.getName());
        category.setColor(categoryDetails.getColor());

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