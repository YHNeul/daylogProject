package com.yhn.daylog.controller;

import com.yhn.daylog.dto.TodoDTO;
import com.yhn.daylog.model.Todo;
import com.yhn.daylog.service.TodoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

  @Autowired
  private TodoService todoService;

  @GetMapping
  public ResponseEntity<List<TodoDTO>> getAllTodos(Authentication authentication) {
    List<Todo> todos = todoService.getAllTodosByUser(authentication.getName());
    List<TodoDTO> todoDTOs = todos.stream()
        .map(TodoDTO::fromEntity)
        .collect(Collectors.toList());
    return ResponseEntity.ok(todoDTOs);
  }

  @GetMapping("/{id}")
  public ResponseEntity<TodoDTO> getTodoById(@PathVariable Long id, Authentication authentication) {
    Todo todo = todoService.getTodoById(id, authentication.getName());
    return ResponseEntity.ok(TodoDTO.fromEntity(todo));
  }

  @PostMapping
  public ResponseEntity<TodoDTO> createTodo(@RequestBody Todo todo, Authentication authentication) {
    Todo newTodo = todoService.createTodo(todo, authentication.getName());
    return ResponseEntity.ok(TodoDTO.fromEntity(newTodo));
  }

  @PutMapping("/{id}")
  public ResponseEntity<TodoDTO> updateTodo(
      @PathVariable Long id,
      @RequestBody Todo todoDetails,
      Authentication authentication) {
    Todo updatedTodo = todoService.updateTodo(id, todoDetails, authentication.getName());
    return ResponseEntity.ok(TodoDTO.fromEntity(updatedTodo));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteTodo(@PathVariable Long id, Authentication authentication) {
    todoService.deleteTodo(id, authentication.getName());
    return ResponseEntity.ok().build();
  }

  @PutMapping("/{id}/progress")
  public ResponseEntity<TodoDTO> updateTodoProgress(
      @PathVariable Long id,
      @RequestBody Map<String, Integer> request,
      Authentication authentication) {
    Integer progress = request.get("progress");
    Todo updatedTodo = todoService.updateTodoProgress(id, progress, authentication.getName());
    return ResponseEntity.ok(TodoDTO.fromEntity(updatedTodo));
  }
}