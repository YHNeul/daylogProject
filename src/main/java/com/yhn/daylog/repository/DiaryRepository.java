package com.yhn.daylog.repository;

import com.yhn.daylog.model.Diary;
import com.yhn.daylog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiaryRepository extends JpaRepository<Diary, Long> {

  List<Diary> findByUserOrderByDateDesc(User user);

  Optional<Diary> findByIdAndUser(Long id, User user);

  @Query("SELECT d FROM Diary d WHERE d.user = :user AND CAST(d.date AS date) = CAST(:date AS date) ORDER BY d.date DESC")
  List<Diary> findByUserAndDate(@Param("user") User user, @Param("date") LocalDateTime date);

  @Query("SELECT d FROM Diary d WHERE d.user = :user AND d.date BETWEEN :startDate AND :endDate ORDER BY d.date DESC")
  List<Diary> findByUserAndDateBetween(
      @Param("user") User user,
      @Param("startDate") LocalDateTime startDate,
      @Param("endDate") LocalDateTime endDate);
}