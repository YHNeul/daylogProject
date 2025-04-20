import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  CircularProgress,
  Button,
  Divider,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useTodos } from '../contexts/TodoContext';
import { useCategories } from '../contexts/CategoryContext';
import TodoProgressCircle from './TodoProgressCircle';

const TodoList = () => {
  const { todos, loading, error, fetchTodos, addTodo, updateTodo, updateTodoProgress, deleteTodo } = useTodos();
  const { categories } = useCategories();

  // 상태 관리
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    dueDate: null,
    showInCalendar: false,
    category: null,
    progress: 0
  });

  // 새 할 일 추가 다이얼로그 열기
  const handleOpenAddDialog = () => {
    setNewTodo({
      title: '',
      description: '',
      dueDate: null,
      showInCalendar: false,
      category: null,
      progress: 0
    });
    setOpenAddDialog(true);
  };

  // 할 일 수정 다이얼로그 열기
  const handleOpenEditDialog = (todo) => {
    setSelectedTodo(todo);
    setNewTodo({
      title: todo.title,
      description: todo.description || '',
      dueDate: todo.dueDate || null,
      showInCalendar: todo.showInCalendar || false,
      category: todo.category ? todo.category.id : null,
      progress: todo.progress || 0
    });
    setOpenEditDialog(true);
  };

  // 입력 필드 변경 처리
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setNewTodo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 진행도 변경 처리
  const handleProgressChange = (_, newValue) => {
    setNewTodo(prev => ({
      ...prev,
      progress: newValue
    }));
  };

  // 할 일 추가 처리
  const handleAddTodo = async () => {
    try {
      const todoData = {
        title: newTodo.title,
        description: newTodo.description,
        dueDate: newTodo.dueDate,
        showInCalendar: newTodo.showInCalendar,
        progress: newTodo.progress,
        category: newTodo.category ? { id: newTodo.category } : null
      };

      await addTodo(todoData);
      setOpenAddDialog(false);
    } catch (error) {
      console.error('할 일 추가 실패:', error);
    }
  };

  // 할 일 수정 처리
  const handleUpdateTodo = async () => {
    try {
      const todoData = {
        title: newTodo.title,
        description: newTodo.description,
        dueDate: newTodo.dueDate,
        showInCalendar: newTodo.showInCalendar,
        progress: newTodo.progress,
        category: newTodo.category ? { id: newTodo.category } : null
      };

      await updateTodo(selectedTodo.id, todoData);
      setOpenEditDialog(false);
    } catch (error) {
      console.error('할 일 수정 실패:', error);
    }
  };

  // 할 일 삭제 처리
  const handleDeleteTodo = async (id) => {
    try {
      await deleteTodo(id);
    } catch (error) {
      console.error('할 일 삭제 실패:', error);
    }
  };

  // 진행도 업데이트 처리
  const handleUpdateProgress = async (id, progress) => {
    try {
      await updateTodoProgress(id, progress);
    } catch (error) {
      console.error('진행도 업데이트 실패:', error);
    }
  };

  return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              할 일 목록
            </Typography>
            <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenAddDialog}
            >
              할 일 추가
            </Button>
          </Box>

          {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
          ) : error ? (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
          ) : (
              <Paper elevation={2} sx={{ p: 2 }}>
                {todos.length === 0 ? (
                    <Typography sx={{ textAlign: 'center', py: 4 }}>
                      할 일이 없습니다. 새 할 일을 추가해보세요!
                    </Typography>
                ) : (
                    <List>
                      {todos.map((todo, index) => (
                          <React.Fragment key={todo.id}>
                            {index > 0 && <Divider component="li" />}
                            <ListItem
                                alignItems="flex-start"
                                sx={{
                                  opacity: todo.completed ? 0.7 : 1,
                                  textDecoration: todo.completed ? 'line-through' : 'none'
                                }}
                            >
                              <ListItemIcon sx={{ minWidth: 44, mt: 1 }}>
                                <TodoProgressCircle
                                    progress={todo.progress || 0}
                                    size={40}
                                />
                              </ListItemIcon>
                              <ListItemText
                                  primary={
                                    <Box display="flex" alignItems="center">
                                      <Typography component="span" variant="body1">
                                        {todo.title}
                                      </Typography>
                                      {todo.category && (
                                          <Typography
                                              component="span"
                                              variant="caption"
                                              sx={{
                                                ml: 1,
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: 1,
                                                bgcolor: 'primary.light',
                                                color: 'white'
                                              }}
                                          >
                                            {todo.category.name}
                                          </Typography>
                                      )}
                                      {todo.showInCalendar && (
                                          <CalendarIcon
                                              fontSize="small"
                                              color="action"
                                              sx={{ ml: 1 }}
                                          />
                                      )}
                                    </Box>
                                  }
                                  secondary={
                                    <React.Fragment>
                                      {todo.description && (
                                          <Typography
                                              component="span"
                                              variant="body2"
                                              color="text.primary"
                                              display="block"
                                          >
                                            {todo.description}
                                          </Typography>
                                      )}
                                      {todo.dueDate && (
                                          <Typography
                                              component="span"
                                              variant="caption"
                                              color="text.secondary"
                                          >
                                            마감일: {format(new Date(todo.dueDate), 'yyyy-MM-dd')}
                                          </Typography>
                                      )}
                                    </React.Fragment>
                                  }
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    aria-label="edit"
                                    onClick={() => handleOpenEditDialog(todo)}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={() => handleDeleteTodo(todo.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          </React.Fragment>
                      ))}
                    </List>
                )}
              </Paper>
          )}
        </Box>

        {/* 할 일 추가 다이얼로그 */}
        <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>할 일 추가</DialogTitle>
          <DialogContent>
            <TextField
                autoFocus
                margin="dense"
                name="title"
                label="제목"
                type="text"
                fullWidth
                required
                value={newTodo.title}
                onChange={handleInputChange}
                sx={{margin: '12px 0'
                }}
            />

            <TextField
                margin="dense"
                name="description"
                label="설명"
                type="text"
                fullWidth
                multiline
                rows={3}
                value={newTodo.description}
                onChange={handleInputChange}
                sx={{ margin: '12px 0' }}
            />

            <TextField
                margin="dense"
                name="dueDate"
                label="마감일"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newTodo.dueDate ? format(new Date(newTodo.dueDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewTodo(prev => ({
                    ...prev,
                    dueDate: value ? new Date(value) : null
                  }));
                }}
                sx={{ margin: '12px 0' }}
            />

            <FormControl fullWidth sx={{ margin: '12px 0' }}>
              <InputLabel id="category-select-label">카테고리</InputLabel>
              <Select
                  labelId="category-select-label"
                  id="category-select"
                  name="category"
                  value={newTodo.category || ''}
                  label="카테고리"
                  onChange={handleInputChange}
              >
                {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ margin: '20px 0' }}>
              <Typography id="progress-slider" gutterBottom>
                진행도: {newTodo.progress}%
              </Typography>
              <Slider
                  aria-labelledby="progress-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                  value={newTodo.progress}
                  onChange={handleProgressChange}
              />
            </Box>

            <FormControlLabel
                control={
                  <Switch
                      checked={newTodo.showInCalendar}
                      onChange={handleInputChange}
                      name="showInCalendar"
                  />
                }
                label="캘린더에 표시"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddDialog(false)}>취소</Button>
            <Button
                onClick={handleAddTodo}
                color="primary"
                disabled={!newTodo.title}
            >
              추가
            </Button>
          </DialogActions>
        </Dialog>

        {/* 할 일 수정 다이얼로그 */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>할 일 수정</DialogTitle>
          <DialogContent>
            <TextField
                autoFocus
                margin="dense"
                name="title"
                label="제목"
                type="text"
                fullWidth
                required
                value={newTodo.title}
                onChange={handleInputChange}
                sx={{ margin: '12px 0' }}
            />

            <TextField
                margin="dense"
                name="description"
                label="설명"
                type="text"
                fullWidth
                multiline
                rows={3}
                value={newTodo.description}
                onChange={handleInputChange}
                sx={{ margin: '12px 0' }}
            />

            <TextField
                margin="dense"
                name="dueDate"
                label="마감일"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newTodo.dueDate ? format(new Date(newTodo.dueDate), 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewTodo(prev => ({
                    ...prev,
                    dueDate: value ? new Date(value) : null
                  }));
                }}
                sx={{ margin: '12px 0' }}
            />

            <FormControl fullWidth sx={{ margin: '12px 0' }}>
              <InputLabel id="category-select-label-edit">카테고리</InputLabel>
              <Select
                  labelId="category-select-label-edit"
                  id="category-select-edit"
                  name="category"
                  value={newTodo.category || ''}
                  label="카테고리"
                  onChange={handleInputChange}
              >
                {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ margin: '20px 0' }}>
              <Typography id="progress-slider-edit" gutterBottom>
                진행도: {newTodo.progress}%
              </Typography>
              <Slider
                  aria-labelledby="progress-slider-edit"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
                  value={newTodo.progress}
                  onChange={handleProgressChange}
              />
            </Box>

            <FormControlLabel
                control={
                  <Switch
                      checked={newTodo.showInCalendar}
                      onChange={handleInputChange}
                      name="showInCalendar"
                  />
                }
                label="캘린더에 표시"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>취소</Button>
            <Button
                onClick={handleUpdateTodo}
                color="primary"
                disabled={!newTodo.title}
            >
              저장
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
  );
};

export default TodoList;