package com.yhn.daylog.service;

import com.yhn.daylog.exception.ApiException;
import com.yhn.daylog.model.Category;
import com.yhn.daylog.model.Todo;
import com.yhn.daylog.model.User;
import com.yhn.daylog.repository.CategoryRepository;
import com.yhn.daylog.repository.TodoRepository;
import com.yhn.daylog.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TodoService {

  @Autowired
  private TodoRepository todoRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private CategoryRepository categoryRepository;

  public List<Todo> getAllTodosByUser(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    // 완료된 항목은 리스트 가장 아래에 표시되도록 정렬
    return todoRepository.findByUser(user).stream()
        .sorted((todo1, todo2) -> {
          if (todo1.getCompleted() && !todo2.getCompleted()) {
            return 1;
          } else if (!todo1.getCompleted() && todo2.getCompleted()) {
            return -1;
          } else {
            return todo1.getCreatedAt().compareTo(todo2.getCreatedAt());
          }
        })
        .collect(Collectors.toList());
  }

  public Todo getTodoById(Long id, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    return todoRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "해당 Todo를 찾을 수 없습니다"));
  }

  @Transactional
  public Todo createTodo(Todo todo, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    // 카테고리 처리
    if (todo.getCategory() != null && todo.getCategory().getId() != null) {
      Category category = categoryRepository.findByIdAndUser(todo.getCategory().getId(), user)
          .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "해당 카테고리를 찾을 수 없습니다"));
      todo.setCategory(category);
    } else {
      // 기본 "개인" 카테고리 찾기
      Category defaultCategory = categoryRepository.findByNameAndUser("개인", user)
          .orElseGet(() -> {
            Category newCategory = new Category();
            newCategory.setName("개인");
            newCategory.setUser(user);
            newCategory.setVisible(true);
            return categoryRepository.save(newCategory);
          });
      todo.setCategory(defaultCategory);
    }

    // 색상 기본값 설정
    if (todo.getColor() == null || todo.getColor().isEmpty()) {
      todo.setColor("#000000"); // 기본 검은색
    }

    // 초기 설정
    todo.setUser(user);
    if (todo.getProgress() == null) {
      todo.setProgress(0);
    }
    todo.setCompleted(todo.getProgress() >= 100);

    return todoRepository.save(todo);
  }

  @Transactional
  public Todo updateTodo(Long id, Todo todoDetails, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    Todo todo = todoRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "해당 Todo를 찾을 수 없습니다"));

    // 필드 업데이트
    if (todoDetails.getTitle() != null) {
      todo.setTitle(todoDetails.getTitle());
    }

    if (todoDetails.getDescription() != null) {
      todo.setDescription(todoDetails.getDescription());
    }

    if (todoDetails.getShowInCalendar() != null) {
      todo.setShowInCalendar(todoDetails.getShowInCalendar());
    }

    if (todoDetails.getDueDate() != null) {
      todo.setDueDate(todoDetails.getDueDate());
    }

    // 달성도 업데이트
    if (todoDetails.getProgress() != null) {
      // 범위 제한 (0-100)
      int progress = Math.max(0, Math.min(100, todoDetails.getProgress()));
      todo.setProgress(progress);

      // 100%이면 완료 상태로 설정
      todo.setCompleted(progress >= 100);
    }

    // 카테고리 업데이트
    if (todoDetails.getCategory() != null && todoDetails.getCategory().getId() != null) {
      Category category = categoryRepository.findByIdAndUser(todoDetails.getCategory().getId(), user)
          .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "해당 카테고리를 찾을 수 없습니다"));
      todo.setCategory(category);
    }

    // 색상 업데이트
    if (todoDetails.getColor() != null) {
      todo.setColor(todoDetails.getColor());
    }

    return todoRepository.save(todo);
  }

  @Transactional
  public void deleteTodo(Long id, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    Todo todo = todoRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "해당 Todo를 찾을 수 없습니다"));

    todoRepository.delete(todo);
  }

  @Transactional
  public Todo updateTodoProgress(Long id, Integer progress, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    Todo todo = todoRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "해당 Todo를 찾을 수 없습니다"));

    // 범위 제한 (0-100)
    progress = Math.max(0, Math.min(100, progress));
    todo.setProgress(progress);

    // 100%이면 완료 상태로 설정
    todo.setCompleted(progress >= 100);

    return todoRepository.save(todo);
  }
}