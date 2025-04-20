import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Fab,
  CircularProgress,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DiaryList from '../components/DiaryList';
import DiaryEditor from '../components/DiaryEditor';
import { useDiaries } from '../contexts/DiaryContext';

const DiaryPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { diaries, loading, error, fetchDiaries } = useDiaries();
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');

  useEffect(() => {
    fetchDiaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateDiary = () => {
    setSelectedDiary({
      title: '',
      content: '',
      date: new Date(),
      relatedEvents: [],
      relatedTodos: []
    });
    setIsCreating(true);
    setIsEditorOpen(true);
  };

  const handleEditDiary = (diary) => {
    setSelectedDiary(diary);
    setIsCreating(false);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedDiary(null);
  };

  const handleSaveSuccess = (message) => {
    setAlertMessage(message);
    setAlertSeverity('success');
    setIsEditorOpen(false);
    fetchDiaries();
  };

  const handleSaveError = (message) => {
    setAlertMessage(message);
    setAlertSeverity('error');
  };

  const handleCloseAlert = () => {
    setAlertMessage('');
  };

  return (
      <Container maxWidth="lg" sx={{ mt: 2, mb: 8 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            다이어리
          </Typography>
          {!isMobile && (
              <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateDiary}
              >
                새 다이어리
              </Button>
          )}
        </Box>

        {loading && (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
        )}

        {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
        )}

        {!loading && diaries.length === 0 ? (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                작성된 다이어리가 없습니다
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                오늘 하루를 기록해보세요!
              </Typography>
              <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleCreateDiary}
              >
                새 다이어리 작성
              </Button>
            </Paper>
        ) : (
            <DiaryList
                diaries={diaries}
                onEdit={handleEditDiary}
                onUpdateSuccess={(message) => {
                  setAlertMessage(message);
                  setAlertSeverity('success');
                  fetchDiaries();
                }}
            />
        )}

        {/* 모바일 환경에서는 플로팅 버튼으로 표시 */}
        {isMobile && (
            <Fab
                color="primary"
                aria-label="add"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
                onClick={handleCreateDiary}
            >
              <AddIcon />
            </Fab>
        )}

        {/* 다이어리 작성/수정 에디터 */}
        {isEditorOpen && selectedDiary && (
            <DiaryEditor
                open={isEditorOpen}
                diary={selectedDiary}
                isCreating={isCreating}
                onClose={handleCloseEditor}
                onSaveSuccess={handleSaveSuccess}
                onSaveError={handleSaveError}
            />
        )}

        {/* 알림 메시지 */}
        <Snackbar open={!!alertMessage} autoHideDuration={6000} onClose={handleCloseAlert}>
          <Alert onClose={handleCloseAlert} severity={alertSeverity} sx={{ width: '100%' }}>
            {alertMessage}
          </Alert>
        </Snackbar>
      </Container>
  );
};

export default DiaryPage;