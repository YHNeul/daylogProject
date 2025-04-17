package com.yhn.daylog.controller;

import com.yhn.daylog.dto.DiaryDTO;
import com.yhn.daylog.dto.DiaryRequestDTO;
import com.yhn.daylog.model.Diary;
import com.yhn.daylog.service.DiaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/diaries")
public class DiaryController {

  @Autowired
  private DiaryService diaryService;

  @GetMapping
  public ResponseEntity<List<DiaryDTO>> getAllDiaries(Authentication authentication) {
    List<Diary> diaries = diaryService.getAllDiariesByUser(authentication.getName());
    List<DiaryDTO> diaryDTOs = DiaryDTO.fromEntities(diaries);
    return ResponseEntity.ok(diaryDTOs);
  }

  @GetMapping("/{id}")
  public ResponseEntity<DiaryDTO> getDiaryById(@PathVariable Long id, Authentication authentication) {
    Diary diary = diaryService.getDiaryById(id, authentication.getName());
    return ResponseEntity.ok(DiaryDTO.fromEntity(diary));
  }

  @GetMapping("/date/{date}")
  public ResponseEntity<List<DiaryDTO>> getDiariesByDate(
      @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
      Authentication authentication) {
    List<Diary> diaries = diaryService.getDiariesByDate(date, authentication.getName());
    List<DiaryDTO> diaryDTOs = DiaryDTO.fromEntities(diaries);
    return ResponseEntity.ok(diaryDTOs);
  }

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<DiaryDTO> createDiary(
      @RequestParam("title") String title,
      @RequestParam("content") String content,
      @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date,
      @RequestParam(value = "relatedEvents", required = false) List<Long> relatedEvents,
      @RequestParam(value = "relatedTodos", required = false) List<Long> relatedTodos,
      @RequestParam(value = "image", required = false) MultipartFile image,
      Authentication authentication) {

    DiaryRequestDTO requestDTO = DiaryRequestDTO.builder()
        .title(title)
        .content(content)
        .date(date)
        .relatedEvents(relatedEvents)
        .relatedTodos(relatedTodos)
        .build();

    Diary newDiary = diaryService.createDiary(requestDTO, image, authentication.getName());
    return ResponseEntity.ok(DiaryDTO.fromEntity(newDiary));
  }

  @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<DiaryDTO> updateDiary(
      @PathVariable Long id,
      @RequestParam("title") String title,
      @RequestParam("content") String content,
      @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime date,
      @RequestParam(value = "relatedEvents", required = false) List<Long> relatedEvents,
      @RequestParam(value = "relatedTodos", required = false) List<Long> relatedTodos,
      @RequestParam(value = "removeImage", required = false) Boolean removeImage,
      @RequestParam(value = "image", required = false) MultipartFile image,
      Authentication authentication) {

    DiaryRequestDTO requestDTO = DiaryRequestDTO.builder()
        .title(title)
        .content(content)
        .date(date)
        .relatedEvents(relatedEvents)
        .relatedTodos(relatedTodos)
        .removeImage(removeImage != null && removeImage)
        .build();

    Diary updatedDiary = diaryService.updateDiary(id, requestDTO, image, authentication.getName());
    return ResponseEntity.ok(DiaryDTO.fromEntity(updatedDiary));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteDiary(@PathVariable Long id, Authentication authentication) {
    diaryService.deleteDiary(id, authentication.getName());
    return ResponseEntity.ok().build();
  }
}