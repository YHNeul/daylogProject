// src/pages/CategoryPage.js
import React, {useState, useEffect} from 'react';
import {
  Box, Typography, Paper, Button, TextField, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogActions, DialogContent, DialogTitle,
  CircularProgress, Snackbar, Alert
} from '@mui/material';
import {Add, Edit, Delete} from '@mui/icons-material';
import axios from 'axios';
import {useAuth} from '../contexts/AuthContext';

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(
      {name: '', color: '#000000'});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {currentUser} = useAuth();
  const API_URL = 'http://localhost:8083';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('카테고리 조회 중 오류 발생:', error);
      setError('카테고리를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setCurrentCategory(category);
      setEditMode(true);
    } else {
      setCurrentCategory({name: '', color: '#000000'});
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setCurrentCategory({
      ...currentCategory,
      [name]: value
    });
  };

  const handleSaveCategory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      if (editMode) {
        await axios.put(`${API_URL}/api/categories/${currentCategory.id}`,
            currentCategory, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
        setSuccess('카테고리가 성공적으로 수정되었습니다');
      } else {
        await axios.post(`${API_URL}/api/categories`, currentCategory, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setSuccess('카테고리가 성공적으로 추가되었습니다');
      }

      handleCloseDialog();
      fetchCategories();
    } catch (error) {
      console.error('카테고리 저장 중 오류 발생:', error);
      setError('카테고리 저장 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('정말로 이 카테고리를 삭제하시겠습니까?')) {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');

        await axios.delete(`${API_URL}/api/categories/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setSuccess('카테고리가 성공적으로 삭제되었습니다');
        fetchCategories();
      } catch (error) {
        console.error('카테고리 삭제 중 오류 발생:', error);
        setError('카테고리 삭제 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center"
             mb={3}>
          <Typography variant="h4">카테고리 관리</Typography>
          <Button
              variant="contained"
              color="primary"
              startIcon={<Add/>}
              onClick={() => handleOpenDialog()}
          >
            새 카테고리
          </Button>
        </Box>

        {loading && <CircularProgress/>}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>이름</TableCell>
                <TableCell>색상</TableCell>
                <TableCell width="120">작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            width: 24,
                            height: 24,
                            bgcolor: category.color,
                            borderRadius: '50%',
                            mr: 1
                          }}
                      />
                      {category.color}
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary"
                                  onClick={() => handleOpenDialog(category)}>
                        <Edit/>
                      </IconButton>
                      <IconButton color="error"
                                  onClick={() => handleDeleteCategory(
                                      category.id)}>
                        <Delete/>
                      </IconButton>
                    </TableCell>
                  </TableRow>
              ))}
              {categories.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      카테고리가 없습니다
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 카테고리 추가/수정 다이얼로그 */}
        <Dialog open={open} onClose={handleCloseDialog}>
          <DialogTitle>{editMode ? '카테고리 수정' : '새 카테고리'}</DialogTitle>
          <DialogContent>
            <TextField
                autoFocus
                margin="dense"
                name="name"
                label="카테고리 이름"
                type="text"
                fullWidth
                value={currentCategory.name}
                onChange={handleInputChange}
                sx={{mb: 2}}
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                색상
              </Typography>
              <TextField
                  name="color"
                  type="color"
                  value={currentCategory.color}
                  onChange={handleInputChange}
                  sx={{width: '100%'}}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>취소</Button>
            <Button onClick={handleSaveCategory} variant="contained"
                    color="primary">
              {loading ? <CircularProgress size={24}/> : '저장'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 알림 메시지 */}
        <Snackbar open={!!error} autoHideDuration={6000}
                  onClose={() => setError('')}>
          <Alert onClose={() => setError('')} severity="error"
                 sx={{width: '100%'}}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar open={!!success} autoHideDuration={6000}
                  onClose={() => setSuccess('')}>
          <Alert onClose={() => setSuccess('')} severity="success"
                 sx={{width: '100%'}}>
            {success}
          </Alert>
        </Snackbar>
      </Box>
  );
};

export default CategoryPage;