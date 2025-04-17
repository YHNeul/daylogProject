import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Close as CloseIcon,
  InsertPhoto as InsertPhotoIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useDiaries } from '../contexts/DiaryContext';
import axios from 'axios';

const DiaryEditor = ({
  open,
  diary,
  isCreating,
  onClose,
  onSaveSuccess,
  onSaveError
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date(),
    relatedEvents: [],
    relatedTodos: []
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 관련 데이터
  const [events, setEvents] = useState([]);
  const [todos, setTodos] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [selectedTodos, setSelectedTodos] = useState([]);
  const [loading, setLoading] = useState(false);

  const { addDiary, updateDiary } = useDiaries();
  const API_URL = 'http://localhost:8083';

  useEffect(() => {
    // 초기 데이터 설정
    if (diary) {
      setFormData({
        title: diary.title || '',
        content: diary.content || '',
        date: diary.date ? new Date(diary.date) : new Date(),
      });

      if (diary.imageUrl) {
        setImagePreview(diary.imageUrl);
      }

      // 초기 선택된 관련 항목 설정
      if (diary.relatedEvents) {
        setSelectedEvents(diary.relatedEvents);
      }
      if (diary.relatedTodos) {
        setSelectedTodos(diary.relatedTodos);
      }
    }

    fetchRelatedData();
  }, [diary]);

  // 이벤트와 할일 데이터 가져오기
  const fetchRelatedData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // 이벤트 데이터 가져오기
      const eventsResponse = await axios.get(`${API_URL}/api/events`, { headers });

      // 할일 데이터 가져오기
      const todosResponse = await axios.get(`${API_URL}/api/todos`, { headers });

      setEvents(eventsResponse.data);
      setTodos(todosResponse.data);
    } catch (error) {
      console.error('관련 데이터 불러오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 입력값 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 에러 상태 지우기
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // 날짜 변경 처리
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date
    }));
  };

  // 이미지 파일 선택 처리
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  // 이미지 제거 처리
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  // 관련 일정 선택 처리
  const handleSelectEvent = (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (event && !selectedEvents.some(e => e.id === eventId)) {
      setSelectedEvents(prev => [...prev, event]);
    }
  };

  // 관련 할일 선택 처리
  const handleSelectTodo = (todoId) => {
    const todo = todos.find(t => t.id === todoId);
    if (todo && !selectedTodos.some(t => t.id === todoId)) {
      setSelectedTodos(prev => [...prev, todo]);
    }
  };

  // 선택된 이벤트 제거
  const handleRemoveEvent = (eventId) => {
    setSelectedEvents(prev => prev.filter(e => e.id !== eventId));
  };

  // 선택된 할일 제거
  const handleRemoveTodo = (todoId) => {
    setSelectedTodos(prev => prev.filter(t => t.id !== todoId));
  };

  // 입력값 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    }

    if (!formData.content.trim()) {
      newErrors.content = '내용을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 다이어리 저장
  const handleSave = async () => {
    try {
      setSaveLoading(true);

      const diaryData = {
        title: formData.title,
        content: formData.content,
        date: formData.date instanceof Date ? formData.date : new Date(),
        image: imageFile,
        removeImage: removeImage,
        relatedEvents: selectedEvents.map(e => e.id),
        relatedTodos: selectedTodos.map(t => t.id)
      };

      if (isCreating) {
        // 새 다이어리 추가
        await addDiary(diaryData);
        onSaveSuccess('다이어리가 성공적으로 작성되었습니다');
      } else {
        // 다이어리 수정
        await updateDiary(diary.id, diaryData);
        onSaveSuccess('다이어리가 성공적으로 수정되었습니다');
      }
    } catch (error) {
      console.error('다이어리 저장 오류:', error);
      onSaveError('다이어리 저장 중 오류가 발생했습니다');
    } finally {
      setSaveLoading(false);
    }
  };

  // 날짜 형식화
  const formatDate = (date) => {
    return format(new Date(date), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko });
  };

  // 이벤트 날짜 형식화
  const formatEventDate = (event) => {
    if (!event.startTime) return '';

    const startDate = new Date(event.startTime);
    if (event.allDay) {
      return format(startDate, 'yyyy-MM-dd');
    }

    return `${format(startDate, 'yyyy-MM-dd HH:mm')}`;
  };

  return (
      <Dialog
          open={open}
          onClose={onClose}
          fullWidth
          maxWidth="md"
          scroll="paper"
      >
        <DialogTitle>
          {isCreating ? '새 다이어리 작성' : '다이어리 수정'}
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              {/* 제목 입력 */}
              <TextField
                  name="title"
                  label="제목"
                  fullWidth
                  margin="normal"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={!!errors.title}
                  helperText={errors.title}
                  autoFocus
              />

              {/* 날짜 선택 */}
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <DatePicker
                    label="날짜"
                    value={formData.date}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal"
                      }
                    }}
                />
              </LocalizationProvider>

              {/* 내용 입력 */}
              <TextField
                  name="content"
                  label="내용"
                  fullWidth
                  multiline
                  rows={10}
                  margin="normal"
                  value={formData.content}
                  onChange={handleInputChange}
                  error={!!errors.content}
                  helperText={errors.content}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              {/* 이미지 업로드 */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  이미지
                </Typography>
                {imagePreview ? (
                    <Box sx={{ position: 'relative', mb: 2 }}>
                      <img
                          src={imagePreview}
                          alt="미리보기"
                          style={{ width: '100%', borderRadius: '4px' }}
                      />
                      <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                          }}
                          onClick={handleRemoveImage}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                ) : (
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<InsertPhotoIcon />}
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                      이미지 업로드
                      <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleImageChange}
                      />
                    </Button>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* 관련 항목 선택 */}
              <Typography variant="subtitle1" gutterBottom>
                관련 항목
              </Typography>

              {/* 관련 일정 */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    <EventIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    관련 일정 {selectedEvents.length > 0 && `(${selectedEvents.length})`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {loading ? (
                      <CircularProgress size={24} sx={{ m: 1 }} />
                  ) : (
                      <>
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                          <InputLabel id="event-select-label">일정 선택</InputLabel>
                          <Select
                              labelId="event-select-label"
                              label="일정 선택"
                              value=""
                              onChange={(e) => handleSelectEvent(e.target.value)}
                              displayEmpty
                          >
                            <MenuItem value="" disabled>일정 선택</MenuItem>
                            {events.map(event => (
                                <MenuItem
                                    key={event.id}
                                    value={event.id}
                                    disabled={selectedEvents.some(e => e.id === event.id)}
                                >
                                  {event.title} ({formatEventDate(event)})
                                </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Box>
                          {selectedEvents.length === 0 ? (
                              <Typography variant="body2" color="textSecondary">
                                선택된 일정이 없습니다
                              </Typography>
                          ) : (
                              selectedEvents.map(event => (
                                  <Chip
                                      key={event.id}
                                      label={`${event.title}`}
                                      onDelete={() => handleRemoveEvent(event.id)}
                                      sx={{ m: 0.5 }}
                                  />
                              ))
                          )}
                        </Box>
                      </>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* 관련 할일 */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    <CheckCircleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    관련 할일 {selectedTodos.length > 0 && `(${selectedTodos.length})`}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {loading ? (
                      <CircularProgress size={24} sx={{ m: 1 }} />
                  ) : (
                      <>
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                          <InputLabel id="todo-select-label">할일 선택</InputLabel>
                          <Select
                              labelId="todo-select-label"
                              label="할일 선택"
                              value=""
                              onChange={(e) => handleSelectTodo(e.target.value)}
                              displayEmpty
                          >
                            <MenuItem value="" disabled>할일 선택</MenuItem>
                            {todos.map(todo => (
                                <MenuItem
                                    key={todo.id}
                                    value={todo.id}
                                    disabled={selectedTodos.some(t => t.id === todo.id)}
                                >
                                  {todo.title} {todo.progress > 0 && `(${todo.progress}%)`}
                                </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Box>
                          {selectedTodos.length === 0 ? (
                              <Typography variant="body2" color="textSecondary">
                                선택된 할일이 없습니다
                              </Typography>
                          ) : (
                              selectedTodos.map(todo => (
                                  <Chip
                                      key={todo.id}
                                      label={`${todo.title}`}
                                      onDelete={() => handleRemoveTodo(todo.id)}
                                      sx={{ m: 0.5 }}
                                  />
                              ))
                          )}
                        </Box>
                      </>
                  )}
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>취소</Button>
          <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={saveLoading}
          >
            {saveLoading ? <CircularProgress size={24} /> : (isCreating ? '작성' : '수정')}
          </Button>
        </DialogActions>
      </Dialog>
  );
};

export default DiaryEditor;