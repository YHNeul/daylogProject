// src/pages/CalendarPage.js
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import {
    Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, FormControlLabel, Checkbox, Select, MenuItem,
    InputLabel, FormControl, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const localizer = momentLocalizer(moment);

const CalendarPage = () => {
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState({
        title: '',
        description: '',
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
        allDay: false,
        category: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    const { currentUser } = useAuth();
    const API_URL = 'http://localhost:8083';

    useEffect(() => {
        fetchEvents();
        fetchCategories();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const response = await axios.get(`${API_URL}/api/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // 이벤트 데이터 형식 변환
            const formattedEvents = response.data.map(event => ({
                ...event,
                startTime: new Date(event.startTime),
                endTime: new Date(event.endTime),
                title: event.title,
                // react-big-calendar에서 필요한 속성 추가
                start: new Date(event.startTime),
                end: new Date(event.endTime),
                allDay: event.allDay
            }));

            setEvents(formattedEvents);
        } catch (error) {
            console.error('이벤트 조회 중 오류 발생:', error);
            setError('이벤트를 불러오는 중 오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await axios.get(`${API_URL}/api/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setCategories(response.data);
        } catch (error) {
            console.error('카테고리 조회 중 오류 발생:', error);
        }
    };

    const handleOpenDialog = (event = null) => {
        if (event && !event.action) { // 기존 이벤트 선택 시
            setCurrentEvent({
                ...event,
                category: event.category ? event.category.id : null
            });
            setIsEditMode(true);
        } else if (event && event.action === 'doubleClick') { // 새 이벤트 생성 (더블 클릭)
            const { start, end } = event.slots;
            setCurrentEvent({
                title: '',
                description: '',
                startTime: start,
                endTime: end || new Date(start.getTime() + 60 * 60 * 1000),
                allDay: false,
                category: null
            });
            setIsEditMode(false);
        } else { // 새 이벤트 버튼 클릭
            setCurrentEvent({
                title: '',
                description: '',
                startTime: new Date(),
                endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
                allDay: false,
                category: null
            });
            setIsEditMode(false);
        }
        setOpen(true);
    };

    const handleCloseDialog = () => {
        setOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value, checked, type } = e.target;
        setCurrentEvent({
            ...currentEvent,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleDateChange = (name, date) => {
        setCurrentEvent({
            ...currentEvent,
            [name]: date
        });
    };

    const handleSaveEvent = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');

            // 백엔드로 전송할 이벤트 데이터 준비
            const eventData = {
                ...currentEvent,
                category: currentEvent.category ? { id: currentEvent.category } : null
            };

            if (isEditMode) {
                await axios.put(`${API_URL}/api/events/${currentEvent.id}`, eventData, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setSuccess('이벤트가 성공적으로 수정되었습니다');
            } else {
                await axios.post(`${API_URL}/api/events`, eventData, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setSuccess('이벤트가 성공적으로 추가되었습니다');
            }

            handleCloseDialog();
            fetchEvents();
        } catch (error) {
            console.error('이벤트 저장 중 오류 발생:', error);
            setError('이벤트 저장 중 오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (window.confirm('정말로 이 이벤트를 삭제하시겠습니까?')) {
            try {
                setLoading(true);
                const token = localStorage.getItem('auth_token');

                await axios.delete(`${API_URL}/api/events/${currentEvent.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setSuccess('이벤트가 성공적으로 삭제되었습니다');
                handleCloseDialog();
                fetchEvents();
            } catch (error) {
                console.error('이벤트 삭제 중 오류 발생:', error);
                setError('이벤트 삭제 중 오류가 발생했습니다');
            } finally {
                setLoading(false);
            }
        }
    };

    // 이벤트 스타일 지정
    const eventStyleGetter = (event) => {
        const backgroundColor = event.category ? event.category.color : '#3174ad';
        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                color: '#fff',
                border: 'none'
            }
        };
    };

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">캘린더</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenDialog()}
                >
                    새 이벤트
                </Button>
            </Box>

            {loading && <CircularProgress />}

            <div style={{ height: 'calc(100vh - 200px)' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={handleOpenDialog}
                    onDoubleClickEvent={handleOpenDialog}
                    onSelectSlot={handleOpenDialog}
                    selectable
                    popup
                    views={['month', 'week', 'day', 'agenda']}
                />
            </div>

            {/* 이벤트 추가/수정 다이얼로그 */}
            <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditMode ? '이벤트 수정' : '새 이벤트'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        name="title"
                        label="제목"
                        type="text"
                        fullWidth
                        value={currentEvent.title}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        margin="dense"
                        name="description"
                        label="설명"
                        type="text"
                        fullWidth
                        multiline
                        rows={3}
                        value={currentEvent.description || ''}
                        onChange={handleInputChange}
                        sx={{ mb: 2 }}
                    />

                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Box display="flex" flexDirection="column" gap={2} sx={{ mb: 2 }}>
                            <DateTimePicker
                                label="시작 시간"
                                value={currentEvent.startTime}
                                onChange={(date) => handleDateChange('startTime', date)}
                                disabled={currentEvent.allDay}
                            />

                            <DateTimePicker
                                label="종료 시간"
                                value={currentEvent.endTime}
                                onChange={(date) => handleDateChange('endTime', date)}
                                disabled={currentEvent.allDay}
                            />
                        </Box>
                    </LocalizationProvider>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={currentEvent.allDay}
                                onChange={handleInputChange}
                                name="allDay"
                            />
                        }
                        label="종일"
                        sx={{ mb: 2 }}
                    />

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="category-label">카테고리</InputLabel>
                        <Select
                            labelId="category-label"
                            name="category"
                            value={currentEvent.category || ''}
                            onChange={handleInputChange}
                            label="카테고리"
                        >
                            <MenuItem value="">
                                <em>없음</em>
                            </MenuItem>
                            {categories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                    <Box display="flex" alignItems="center">
                                        <Box
                                            component="span"
                                            sx={{
                                                display: 'inline-block',
                                                width: 16,
                                                height: 16,
                                                bgcolor: category.color,
                                                borderRadius: '50%',
                                                mr: 1
                                            }}
                                        />
                                        {category.name}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    {isEditMode && (
                        <Button onClick={handleDeleteEvent} color="error">
                            삭제
                        </Button>
                    )}
                    <Button onClick={handleCloseDialog}>취소</Button>
                    <Button onClick={handleSaveEvent} variant="contained" color="primary">
                        {loading ? <CircularProgress size={24} /> : '저장'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 알림 메시지 */}
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
                <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
                <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
                    {success}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CalendarPage;