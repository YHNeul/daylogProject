package com.yhn.daylog.service;

import com.yhn.daylog.dto.DiaryRequestDTO;
import com.yhn.daylog.exception.ApiException;
import com.yhn.daylog.model.*;
import com.yhn.daylog.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
public class DiaryService {

  @Autowired
  private DiaryRepository diaryRepository;

  @Autowired
  private DiaryRelationRepository relationRepository;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private CalendarEventRepository eventRepository;

  @Autowired
  private TodoRepository todoRepository;

  @Value("${app.upload.dir:${user.home}/uploads/images}")
  private String uploadDir;

  public List<Diary> getAllDiariesByUser(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    return diaryRepository.findByUserOrderByDateDesc(user);
  }

  public Diary getDiaryById(Long id, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    return diaryRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "다이어리를 찾을 수 없습니다"));
  }

  public List<Diary> getDiariesByDate(LocalDate date, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    LocalDateTime startOfDay = date.atStartOfDay();
    LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

    return diaryRepository.findByUserAndDateBetween(user, startOfDay, endOfDay);
  }

  @Transactional
  public Diary createDiary(DiaryRequestDTO requestDTO, MultipartFile image, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    // 다이어리 기본 정보 설정
    Diary diary = new Diary();
    diary.setTitle(requestDTO.getTitle());
    diary.setContent(requestDTO.getContent());
    // 날짜가 null이면 현재 날짜로 설정
    if (requestDTO.getDate() != null) {
      diary.setDate(requestDTO.getDate());
    } else {
      diary.setDate(LocalDateTime.now()); // 기본값으로 현재 시간 설정
    }

    diary.setUser(user);

    // 이미지 처리
    if (image != null && !image.isEmpty()) {
      String imageUrl = saveImage(image);
      diary.setImageUrl(imageUrl);
    }

    // 다이어리 저장
    Diary savedDiary = diaryRepository.save(diary);

    // 관련 일정 처리
    if (requestDTO.getRelatedEvents() != null && !requestDTO.getRelatedEvents().isEmpty()) {
      for (Long eventId : requestDTO.getRelatedEvents()) {
        CalendarEvent event = eventRepository.findByIdAndUser(eventId, user)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "일정을 찾을 수 없습니다: " + eventId));

        DiaryRelation relation = new DiaryRelation();
        relation.setDiary(savedDiary);
        relation.setCalendarEvent(event);
        relation.setRelationType(DiaryRelation.RelationType.EVENT);
        relationRepository.save(relation);
      }
    }

    // 관련 할일 처리
    if (requestDTO.getRelatedTodos() != null && !requestDTO.getRelatedTodos().isEmpty()) {
      for (Long todoId : requestDTO.getRelatedTodos()) {
        Todo todo = todoRepository.findByIdAndUser(todoId, user)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "할일을 찾을 수 없습니다: " + todoId));

        DiaryRelation relation = new DiaryRelation();
        relation.setDiary(savedDiary);
        relation.setTodoItem(todo);
        relation.setRelationType(DiaryRelation.RelationType.TODO);
        relationRepository.save(relation);
      }
    }

    return savedDiary;
  }

  @Transactional
  public Diary updateDiary(Long id, DiaryRequestDTO requestDTO, MultipartFile image, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    Diary diary = diaryRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "다이어리를 찾을 수 없습니다"));

    // 기본 정보 업데이트
    diary.setTitle(requestDTO.getTitle());
    diary.setContent(requestDTO.getContent());

    // 날짜 필드 명시적 설정 (추가)
    if (requestDTO.getDate() != null) {
      diary.setDate(requestDTO.getDate());
    } else {
      diary.setDate(LocalDateTime.now()); // 날짜가 없으면 현재 시간으로 설정
    }

    // 이미지 처리
    if (image != null && !image.isEmpty()) {
      // 기존 이미지 파일 삭제
      if (diary.getImageUrl() != null) {
        deleteImage(diary.getImageUrl());
      }
      // 새 이미지 저장
      String imageUrl = saveImage(image);
      diary.setImageUrl(imageUrl);
    } else if (Boolean.TRUE.equals(requestDTO.getRemoveImage())) {
      // 이미지 삭제 요청이 있는 경우
      if (diary.getImageUrl() != null) {
        deleteImage(diary.getImageUrl());
        diary.setImageUrl(null);
      }
    }

    // 관련 항목 업데이트를 위해 기존 관계 삭제
    List<DiaryRelation> existingRelations = relationRepository.findByDiary(diary);
    relationRepository.deleteAll(existingRelations);

    // 관련 일정 처리
    if (requestDTO.getRelatedEvents() != null) {
      for (Long eventId : requestDTO.getRelatedEvents()) {
        CalendarEvent event = eventRepository.findByIdAndUser(eventId, user)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "일정을 찾을 수 없습니다: " + eventId));

        DiaryRelation relation = new DiaryRelation();
        relation.setDiary(diary);
        relation.setCalendarEvent(event);
        relation.setRelationType(DiaryRelation.RelationType.EVENT);
        relationRepository.save(relation);
      }
    }

    // 관련 할일 처리
    if (requestDTO.getRelatedTodos() != null) {
      for (Long todoId : requestDTO.getRelatedTodos()) {
        Todo todo = todoRepository.findByIdAndUser(todoId, user)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "할일을 찾을 수 없습니다: " + todoId));

        DiaryRelation relation = new DiaryRelation();
        relation.setDiary(diary);
        relation.setTodoItem(todo);
        relation.setRelationType(DiaryRelation.RelationType.TODO);
        relationRepository.save(relation);
      }
    }

    return diaryRepository.save(diary);
  }

  @Transactional
  public void deleteDiary(Long id, String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

    Diary diary = diaryRepository.findByIdAndUser(id, user)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "다이어리를 찾을 수 없습니다"));

    // 이미지 파일 삭제
    if (diary.getImageUrl() != null) {
      deleteImage(diary.getImageUrl());
    }

    // 관련 관계 삭제
    relationRepository.deleteByDiary(diary);

    // 다이어리 삭제
    diaryRepository.delete(diary);
  }

  // 이미지 저장 메소드
  private String saveImage(MultipartFile file) {
    try {
      // 업로드 디렉토리 경로 확인 및 생성
      Path uploadPath = Paths.get(uploadDir);
      if (!Files.exists(uploadPath)) {
        try {
          Files.createDirectories(uploadPath);
          System.out.println("업로드 디렉토리 생성: " + uploadPath);
        } catch (IOException e) {
          System.err.println("디렉토리 생성 실패: " + e.getMessage());
          throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 저장 디렉토리를 생성할 수 없습니다");
        }
      }

      // 고유 파일명 생성
      String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
      String fileExtension = StringUtils.getFilenameExtension(originalFilename);
      String fileName = UUID.randomUUID() + "." + fileExtension;

      // 파일 저장
      Path filePath = uploadPath.resolve(fileName);
      Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
      System.out.println("이미지 저장됨: " + filePath);

      // 상대 URL 경로 반환
      return "/uploads/images/" + fileName;
    } catch (IOException e) {
      System.err.println("이미지 저장 중 오류: " + e.getMessage());
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "이미지 저장 중 오류가 발생했습니다: " + e.getMessage());
    }
  }

  // 이미지 삭제 메소드
  private void deleteImage(String imageUrl) {
    try {
      if (imageUrl != null && imageUrl.startsWith("/uploads/images/")) {
        String fileName = imageUrl.substring("/uploads/images/".length());
        Path filePath = Paths.get(uploadDir).resolve(fileName);
        Files.deleteIfExists(filePath);
      }
    } catch (IOException e) {
      // 파일 삭제 실패는 로그만 남기고 예외는 발생시키지 않음
      System.err.println("이미지 삭제 중 오류 발생: " + e.getMessage());
    }
  }
}