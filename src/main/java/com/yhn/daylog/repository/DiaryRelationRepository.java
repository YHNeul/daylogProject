package com.yhn.daylog.repository;

import com.yhn.daylog.model.CalendarEvent;
import com.yhn.daylog.model.Diary;
import com.yhn.daylog.model.DiaryRelation;
import com.yhn.daylog.model.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiaryRelationRepository extends JpaRepository<DiaryRelation, Long> {

  List<DiaryRelation> findByDiary(Diary diary);

  List<DiaryRelation> findByCalendarEvent(CalendarEvent event);

  List<DiaryRelation> findByTodoItem(Todo todo);

  void deleteByDiary(Diary diary);

  void deleteByCalendarEvent(CalendarEvent event);

  void deleteByTodoItem(Todo todo);
}