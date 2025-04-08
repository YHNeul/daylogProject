import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Paper,
  Drawer,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useTodos } from '../contexts/TodoContext';
import axios from 'axios';

const EventDetailsSidebar = ({
  open,
  onClose,
  selectedDate,
  events = [],
  loading
}) => {
  // 선택된 날짜 포맷
  const formattedDate = selectedDate
      ? format(selectedDate, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })
      : '';

  // TodoContext에서 함수 가져오기
  const { updateTodoProgress } = useTodos();
  const API_URL = 'http://localhost:8083';

// 이벤트 정렬: 일정 먼저, 완료된 할일은 맨 아래로
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      // 일정은 항상 할일보다 위에
      if (a.type === 'event' && b.type === 'todo') return -1;
      if (a.type === 'todo' && b.type === 'event') return 1;

      // 두 항목 다 할일인 경우, 완료된 항목은 아래로
      if (a.type === 'todo' && b.type === 'todo') {
        const aCompleted = a.progress === 100;
        const bCompleted = b.progress === 100;

        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;
      }

      // 생성 시간 순으로 정렬
      return 0;
    });
  }, [events]);

  // 할일 체크박스 처리
  const handleTodoCheck = (todo) => {
    if (!todo || !todo.id) return;

    // todo-123 형식에서 123 추출
    const todoId = typeof todo.id === 'string' ?
        Number(todo.id.split('-')[1]) : todo.id;

    // 현재 상태의 반대로 설정 (완료/미완료 토글)
    const newProgress = todo.progress === 100 ? 0 : 100;
    updateTodoProgress(todoId, newProgress);
  };

  return (
      <Drawer
          anchor="right"
          open={open}
          onClose={onClose}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 350 },
              maxWidth: '100%',
              padding: 2
            }
          }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            {formattedDate}
          </Typography>
          <IconButton onClick={onClose} aria-label="close sidebar">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
        ) : (
            <>
              {/* 일정 및 할일 섹션 */}
              {sortedEvents.length > 0 ? (
                  <List disablePadding>
                    {sortedEvents.map((event) => (
                        <ListItem
                            key={event.id}
                            component={Paper}
                            elevation={1}
                            sx={{
                              mb: 1,
                              p: 1.5,
                              borderLeft: `4px solid ${event.color || '#3174ad'}`,
                              opacity: event.type === 'todo' && event.progress === 100 ? 0.5 : 1,
                              textDecoration: event.type === 'todo' && event.progress === 100 ? 'line-through' : 'none'
                            }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {event.type === 'todo' ? (
                                <Checkbox
                                    checked={event.progress === 100}
                                    onChange={() => handleTodoCheck(event)}
                                    color="primary"
                                />
                            ) : (
                                <EventIcon />
                            )}
                          </ListItemIcon>
                          <ListItemText
                              primary={event.title}
                              secondary={
                                <>
                                  {event.type === 'event' ? (
                                      event.allDay ? (
                                          '종일'
                                      ) : (
                                          `${format(new Date(event.startTime), 'HH:mm')} - ${format(new Date(event.endTime), 'HH:mm')}`
                                      )
                                  ) : (
                                      `진행도: ${event.progress || 0}%`
                                  )}
                                  {event.description && (
                                      <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                                        {event.description}
                                      </Typography>
                                  )}
                                </>
                              }
                          />
                        </ListItem>
                    ))}
                  </List>
              ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    일정이 없습니다.
                  </Typography>
              )}
            </>
        )}
      </Drawer>
  );
};

export default EventDetailsSidebar;