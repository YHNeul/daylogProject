package com.yhn.daylog.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "diary_relation")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiaryRelation {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "diary_id", nullable = false)
  private Diary diary;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "calendar_event_id")
  private CalendarEvent calendarEvent;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "todo_item_id")
  private Todo todoItem;

  @Column(name = "relation_type")
  @Enumerated(EnumType.STRING)
  private RelationType relationType;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public enum RelationType {
    EVENT, TODO
  }
}