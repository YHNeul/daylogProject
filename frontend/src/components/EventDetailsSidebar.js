// src/components/EventDetailsSidebar.js
import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Drawer,
  CircularProgress
} from '@mui/material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';

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
              {/* 일정 섹션 */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                일정
              </Typography>
              {events.length > 0 ? (
                  <List disablePadding>
                    {events.map((event) => (
                        <ListItem
                            key={event.id}
                            component={Paper}
                            elevation={1}
                            sx={{
                              mb: 1,
                              p: 1.5,
                              borderLeft: `4px solid ${event.color || '#3174ad'}`
                            }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <EventIcon />
                          </ListItemIcon>
                          <ListItemText
                              primary={event.title}
                              secondary={
                                <>
                                  {event.allDay ? (
                                      '종일'
                                  ) : (
                                      `${format(new Date(event.startTime), 'HH:mm')} - ${format(new Date(event.endTime), 'HH:mm')}`
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