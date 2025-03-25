package com.yhn.daylog.repository;

import com.yhn.daylog.model.Category;
import com.yhn.daylog.model.CategoryVisibility;
import com.yhn.daylog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryVisibilityRepository extends JpaRepository<CategoryVisibility, Long> {
    List<CategoryVisibility> findByUser(User user);

    // 반환 타입을 Optional<CategoryVisibility>에서 List<CategoryVisibility>로 변경
    List<CategoryVisibility> findByCategoryAndUser(Category category, User user);
}