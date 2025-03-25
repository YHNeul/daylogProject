package com.yhn.daylog.service;

import com.yhn.daylog.dto.CategoryVisibilityDTO;
import com.yhn.daylog.model.Category;
import com.yhn.daylog.model.CategoryVisibility;
import com.yhn.daylog.model.User;
import com.yhn.daylog.repository.CategoryRepository;
import com.yhn.daylog.repository.CategoryVisibilityRepository;
import com.yhn.daylog.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryVisibilityService {

    @Autowired
    private CategoryVisibilityRepository visibilityRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    public List<CategoryVisibilityDTO> getAllCategoryVisibilitiesByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        List<CategoryVisibility> visibilities = visibilityRepository.findByUser(user);

        return visibilities.stream()
                .map(visibility -> new CategoryVisibilityDTO(
                        visibility.getId(),
                        visibility.getCategory().getId(),
                        visibility.getCategory().getName(),
                        visibility.getVisible()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryVisibilityDTO updateCategoryVisibility(Long categoryId, Boolean visible, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        Category category = categoryRepository.findByIdAndUser(categoryId, user)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + categoryId));

        // 해당 카테고리에 대한 가시성 정보가 있는지 확인
        // findByCategoryAndUser가 여러 결과를 반환하는 문제 해결
        List<CategoryVisibility> visibilities = visibilityRepository.findByCategoryAndUser(category, user);

        CategoryVisibility visibility;

        if (visibilities.isEmpty()) {
            // 없으면 새로 생성
            visibility = new CategoryVisibility();
            visibility.setCategory(category);
            visibility.setUser(user);
        } else {
            // 중복된 레코드가 있으면 첫 번째 것만 사용하고 나머지 삭제
            visibility = visibilities.get(0);

            // 중복 레코드 삭제 (첫 번째 것 제외)
            if (visibilities.size() > 1) {
                for (int i = 1; i < visibilities.size(); i++) {
                    visibilityRepository.delete(visibilities.get(i));
                }
            }
        }

        visibility.setVisible(visible);
        visibility = visibilityRepository.save(visibility);

        return new CategoryVisibilityDTO(
                visibility.getId(),
                visibility.getCategory().getId(),
                visibility.getCategory().getName(),
                visibility.getVisible()
        );
    }

    @Transactional
    public void createDefaultVisibilityForCategory(Category category, User user) {
        // 새 카테고리 생성 시 기본 가시성 설정
        CategoryVisibility visibility = new CategoryVisibility();
        visibility.setCategory(category);
        visibility.setUser(user);
        visibility.setVisible(true);
        visibilityRepository.save(visibility);
    }
}