import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const { currentUser, logout, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const API_URL = 'http://localhost:8083';

  useEffect(() => {
    if (currentUser) {
      setUserInfo(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // 비밀번호 변경 시 일치 여부 확인
    if (userInfo.password && userInfo.password !== userInfo.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('auth_token');

      const updateData = {
        name: userInfo.name
      };

      // 비밀번호가 입력된 경우에만 포함
      if (userInfo.password) {
        updateData.password = userInfo.password;
      }

      const response = await axios.put(`${API_URL}/api/users/me`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 응답으로 받은 사용자 정보로 전역 상태 업데이트
      updateCurrentUser(response.data);

      setSuccess('프로필이 성공적으로 업데이트되었습니다.');

      // 비밀번호 필드 초기화
      setUserInfo(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));

    } catch (error) {
      setError(error.response?.data?.message || '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      await axios.delete(`${API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 로그아웃 처리
      await logout();

      // 로그인 페이지로 이동
      navigate('/login');

    } catch (error) {
      setError(error.response?.data?.message || '회원 탈퇴 중 오류가 발생했습니다.');
      handleCloseDeleteDialog();
    } finally {
      setLoading(false);
    }
  };

  return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            내 프로필
          </Typography>

          {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
          )}

          {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
          )}

          <Paper elevation={3} sx={{ p: 4 }}>
            <form onSubmit={handleUpdateProfile}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                      fullWidth
                      label="이메일"
                      name="email"
                      value={userInfo.email}
                      InputProps={{
                        readOnly: true,
                      }}
                      disabled
                      variant="filled"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                      fullWidth
                      label="이름"
                      name="name"
                      value={userInfo.name}
                      onChange={handleInputChange}
                      required
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    비밀번호 변경 (선택사항)
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                      fullWidth
                      label="새 비밀번호"
                      name="password"
                      type="password"
                      value={userInfo.password}
                      onChange={handleInputChange}
                      helperText="변경을 원하시면 입력해주세요"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                      fullWidth
                      label="새 비밀번호 확인"
                      name="confirmPassword"
                      type="password"
                      value={userInfo.confirmPassword}
                      onChange={handleInputChange}
                      error={userInfo.password !== userInfo.confirmPassword && userInfo.confirmPassword !== ''}
                      helperText={userInfo.password !== userInfo.confirmPassword && userInfo.confirmPassword !== '' ? "비밀번호가 일치하지 않습니다" : ""}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : '저장'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>

          <Divider sx={{ my: 4 }} />

          <Paper elevation={3} sx={{ p: 4, bgcolor: '#ffebee' }}>
            <Typography variant="h6" color="error" gutterBottom>
              계정 삭제
            </Typography>
            <Typography variant="body2" paragraph>
              계정을 삭제하면 모든 데이터가 영구적으로 제거됩니다. 이 작업은 취소할 수 없습니다.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                  variant="outlined"
                  color="error"
                  onClick={handleOpenDeleteDialog}
              >
                계정 삭제
              </Button>
            </Box>
          </Paper>

          {/* 계정 삭제 확인 다이얼로그 */}
          <Dialog
              open={openDeleteDialog}
              onClose={handleCloseDeleteDialog}
          >
            <DialogTitle>계정 삭제 확인</DialogTitle>
            <DialogContent>
              <DialogContentText>
                정말로 계정을 삭제하시겠습니까? 모든 데이터가 영구적으로 제거됩니다. 이 작업은 취소할 수 없습니다.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDeleteDialog}>취소</Button>
              <Button
                  onClick={handleDeleteAccount}
                  color="error"
                  disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : '삭제'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
  );
};

export default ProfilePage;