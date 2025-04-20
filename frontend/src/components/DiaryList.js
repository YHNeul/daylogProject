import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Chip,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useDiaries } from '../contexts/DiaryContext';

const DiaryList = ({ diaries, onEdit, onUpdateSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedDiaryId, setSelectedDiaryId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewDiary, setViewDiary] = useState(null);

  const { deleteDiary } = useDiaries();

  // 메뉴 열기
  const handleMenuOpen = (event, diaryId) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedDiaryId(diaryId);
  };

  // 메뉴 닫기
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // 다이어리 보기
  const handleViewDiary = (diary) => {
    setViewDiary(diary);
    setViewDialogOpen(true);
    handleMenuClose();
  };

  // 다이어리 수정
  const handleEditDiary = () => {
    const diary = diaries.find(d => d.id === selectedDiaryId);
    if (diary) {
      onEdit(diary);
    }
    handleMenuClose();
  };

  // 다이어리 삭제 확인 다이얼로그
  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // 다이어리 삭제 진행
  const handleDeleteDiary = async () => {
    try {
      await deleteDiary(selectedDiaryId);
      onUpdateSuccess('다이어리가 성공적으로 삭제되었습니다');
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('다이어리 삭제 실패:', error);
    }
  };

  // 다이어리 내용 일부 표시 (최대 200자)
  const truncateContent = (content, maxLength = 100) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // 날짜 형식화
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy년 MM월 dd일 (EEEE)', { locale: ko });
    } catch (error) {
      return dateString;
    }
  };

  return (
      <div>
        <Grid container spacing={3}>
          {diaries.map(diary => (
              <Grid item key={diary.id} xs={12} sm={6} md={4}>
                <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleViewDiary(diary)}
                >
                  {diary.imageUrl ? (
                      <CardMedia
                          component="img"
                          height="140"
                          image={diary.imageUrl ? `${process.env.REACT_APP_API_URL || ''}${diary.imageUrl}` : ''}
                          alt={diary.title}
                      />
                  ) : (
                      <Box
                          sx={{
                            height: 140,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'grey.200'
                          }}
                      >
                        <ImageIcon color="disabled" sx={{ fontSize: 48 }} />
                      </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      {formatDate(diary.date)}
                    </Typography>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {diary.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {truncateContent(diary.content)}
                    </Typography>

                    {/* 관련 일정/할일 라벨 */}
                    {(diary.relatedEvents?.length > 0 || diary.relatedTodos?.length > 0) && (
                        <Box sx={{ mt: 1 }}>
                          {diary.relatedEvents?.length > 0 && (
                              <Chip
                                  icon={<EventIcon />}
                                  label={`일정 ${diary.relatedEvents.length}개`}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                              />
                          )}
                          {diary.relatedTodos?.length > 0 && (
                              <Chip
                                  icon={<CheckCircleIcon />}
                                  label={`할일 ${diary.relatedTodos.length}개`}
                                  size="small"
                                  sx={{ mb: 0.5 }}
                              />
                          )}
                        </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'flex-end' }}>
                    <IconButton
                        aria-label="더 보기"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, diary.id);
                        }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
          ))}
        </Grid>

        {/* 카드 메뉴 */}
        <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
        >
          <MenuItem onClick={handleEditDiary}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            수정
          </MenuItem>
          <MenuItem onClick={handleDeleteConfirm}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            삭제
          </MenuItem>
        </Menu>

        {/* 다이어리 삭제 확인 다이얼로그 */}
        <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>다이어리 삭제</DialogTitle>
          <DialogContent>
            <DialogContentText>
              정말 이 다이어리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
            <Button onClick={handleDeleteDiary} color="error">삭제</Button>
          </DialogActions>
        </Dialog>

        {/* 다이어리 상세 보기 다이얼로그 */}
        <Dialog
            open={viewDialogOpen}
            onClose={() => setViewDialogOpen(false)}
            fullWidth
            maxWidth="md"
            scroll="paper"
        >
          {viewDiary && (
              <>
                <DialogTitle>
                  {viewDiary.title}
                  <Typography variant="subtitle2" color="textSecondary" component="div">
                    {formatDate(viewDiary.date)}
                  </Typography>
                </DialogTitle>
                <DialogContent dividers>
                  {viewDiary.imageUrl && (
                      <Box sx={{ mb: 2, textAlign: 'center' }}>
                        <img
                            src={viewDiary.imageUrl ? `${process.env.REACT_APP_API_URL || ''}${viewDiary.imageUrl}` : ''}
                            alt={viewDiary.title}
                            style={{ maxWidth: '100%', maxHeight: '300px' }}
                        />
                      </Box>
                  )}

                  {/* 관련 일정 및 할일 표시 */}
                  {(viewDiary.relatedEvents?.length > 0 || viewDiary.relatedTodos?.length > 0) && (
                      <Box sx={{ mb: 2 }}>
                        {viewDiary.relatedEvents?.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="subtitle2">
                                <EventIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                관련 일정
                              </Typography>
                              {viewDiary.relatedEvents.map(event => (
                                  <Chip
                                      key={`event-${event.id}`}
                                      label={event.title || `일정 #${event.id}`}
                                      size="small"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                              ))}
                            </Box>
                        )}

                        {viewDiary.relatedTodos?.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2">
                                <CheckCircleIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                관련 할일
                              </Typography>
                              {viewDiary.relatedTodos.map(todo => (
                                  <Chip
                                      key={`todo-${todo.id}`}
                                      label={todo.title || `할일 #${todo.id}`}
                                      size="small"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                  />
                              ))}
                            </Box>
                        )}
                      </Box>
                  )}

                  <Divider sx={{ mb: 2 }} />

                  {/* 다이어리 내용 - 줄바꿈 유지 */}
                  <Typography
                      variant="body1"
                      component="div"
                      sx={{ whiteSpace: 'pre-wrap' }}
                  >
                    {viewDiary.content}
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setViewDialogOpen(false);
                        onEdit(viewDiary);
                      }}
                  >
                    수정
                  </Button>
                  <Button onClick={() => setViewDialogOpen(false)}>닫기</Button>
                </DialogActions>
              </>
          )}
        </Dialog>
      </div>
  );
};

export default DiaryList;