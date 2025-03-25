// src/pages/CalendarPage.js
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import {
    Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, FormControlLabel, Switch, Select, MenuItem,
    InputLabel, FormControl, CircularProgress, Snackbar, Alert,
    Grid, Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
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
        allDay: true,
        category: null,
        color: '#FFFFFF' // 기본 흰색
    });
    const [showTimeSelection, setShowTimeSelection] = useState(false);
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

            // 이벤트 데이터 가져오기
            const response = await axios.get(`${API_URL}/api/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // 카테고리 가시성 정보 가져오기
            let visibleCategoryIds = [];
            try {
                const visibilityResponse = await axios.get(`${API_URL}/api/categories/visibility`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                visibleCategoryIds = visibilityResponse.data
                    .filter(v => v.visible)
                    .map(v => v.categoryId);

                console.log('보이는 카테고리 ID:', visibleCategoryIds);
            } catch (error) {
                console.error('카테고리 가시성 정보 조회 중 오류:', error);
                // API 오류 시 모든 카테고리를 보이도록 설정
                visibleCategoryIds = categories.map(cat => cat.id);
            }

            console.log('서버에서 받은 이벤트:', response.data);

            // 이벤트 데이터 형식 변환
            const formattedEvents = response.data
                // 두 가지 조건 중 하나를 만족하는 이벤트만 표시:
                // 1. 카테고리가 없는 이벤트
                // 2. 보이는 카테고리에 속한 이벤트
                .filter(event => {
                    // 카테고리가 없는 경우 보여주기
                    if (!event.category || !event.category.id) return true;

                    // 카테고리가 있는 경우 해당 카테고리가 보이는지 확인
                    return visibleCategoryIds.includes(event.category.id);
                })
                .map(event => {
                    // 원본 데이터 보존
                    const originalStartTime = new Date(event.startTime);
                    const originalEndTime = new Date(event.endTime);

                    // 화면 표시용 데이터 (React-Big-Calendar용)
                    let displayStart = new Date(originalStartTime);
                    let displayEnd = new Date(originalEndTime);

                    // allDay 이벤트인 경우 캘린더 표시 방식 조정
                    if (event.allDay) {
                        // 종료일이 23:59:59로 설정된 경우 (데이터베이스에 저장된 형식)
                        // React-Big-Calendar는 exclusive end date를 사용하므로 +1일 해야 함
                        if (displayEnd.getHours() === 23 && displayEnd.getMinutes() === 59) {
                            // 다음 날 00:00:00으로 설정
                            const nextDay = new Date(displayEnd);
                            nextDay.setDate(nextDay.getDate() + 1);
                            nextDay.setHours(0, 0, 0, 0);
                            displayEnd = nextDay;
                        }
                    }

                    // 색상이 없는 경우 기본값 설정
                    const color = event.color || (event.category ? event.category.color : '#FFFFFF');

                    return {
                        ...event,
                        // 원본 데이터 유지 (폼에서 사용)
                        startTime: originalStartTime,
                        endTime: originalEndTime,
                        // 캘린더 표시용 데이터
                        start: displayStart,
                        end: displayEnd,
                        allDay: event.allDay,
                        color: color
                    };
                });

            console.log('변환된 이벤트:', formattedEvents);
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
            // 기존 로직 유지
            const startTime = new Date(event.startTime);
            const endTime = new Date(event.endTime);

            setCurrentEvent({
                ...event,
                startTime: startTime,
                endTime: endTime,
                category: event.category ? event.category.id : null
            });
            setShowTimeSelection(!event.allDay);
            setIsEditMode(true);
        } else if (event && event.action === 'doubleClick') { // 새 이벤트 생성 (더블 클릭)
            // 사용자가 클릭한 날짜 적용
            const { start } = event.slots;
            const clickedDate = new Date(start);

            // 날짜만 남기고 시간 정보는 초기화
            const newStart = new Date(
                clickedDate.getFullYear(),
                clickedDate.getMonth(),
                clickedDate.getDate(),
                0, 0, 0, 0
            );

            // 종료일도 동일한 날짜로 정확히 설정 (시간은 23:59:59)
            const newEnd = new Date(
                newStart.getFullYear(),
                newStart.getMonth(),
                newStart.getDate(),
                23, 59, 59, 999
            );

            console.log("새 일정 날짜 확인 (더블클릭):", {
                clickedDate: clickedDate.toISOString(),
                newStart: newStart.toISOString(),
                newEnd: newEnd.toISOString()
            });

            // 카테고리가 없다면 기본 카테고리 찾기
            const defaultCategory = categories.find(cat => cat.name === '기본');
            const defaultCategoryId = defaultCategory ? defaultCategory.id : null;

            setCurrentEvent({
                title: '',
                description: '',
                startTime: newStart,
                endTime: newEnd,
                allDay: true,
                category: defaultCategoryId,  // 여기에 기본 카테고리 ID 설정
                color: '#FFFFFF'
            });

            setShowTimeSelection(false);
            setIsEditMode(false);
        } else if (event && event.action === 'select') { // 날짜 범위 선택
            const { start, end } = event.slots;

            // 시작일 설정 (시간 00:00:00)
            const startYear = start.getFullYear();
            const startMonth = start.getMonth();
            const startDay = start.getDate();

            const newStart = new Date(startYear, startMonth, startDay, 0, 0, 0, 0);

            // 종료일 설정 (시간 23:59:59)
            // end는 exclusive date이므로 하루를 빼야 함
            const adjustedEnd = new Date(end);
            adjustedEnd.setDate(adjustedEnd.getDate() - 1);

            const endYear = adjustedEnd.getFullYear();
            const endMonth = adjustedEnd.getMonth();
            const endDay = adjustedEnd.getDate();

            const newEnd = new Date(endYear, endMonth, endDay, 23, 59, 59, 999);

            console.log("새 일정 날짜 확인 (범위선택):", {
                originalStart: start.toISOString(),
                originalEnd: end.toISOString(),
                newStart: newStart.toISOString(),
                newEnd: newEnd.toISOString()
            });

            // 카테고리가 없다면 기본 카테고리 찾기
            const defaultCategory = categories.find(cat => cat.name === '기본');
            const defaultCategoryId = defaultCategory ? defaultCategory.id : null;

            setCurrentEvent({
                title: '',
                description: '',
                startTime: newStart,
                endTime: newEnd,
                allDay: true,
                category: defaultCategoryId,  // 여기에 기본 카테고리 ID 설정
                color: '#FFFFFF'
            });

            setShowTimeSelection(false);
            setIsEditMode(false);

        } else { // 새 이벤트 버튼 클릭
            // 오늘 날짜만 남기고 시간 정보는 초기화
            const today = new Date();
            const todayYear = today.getFullYear();
            const todayMonth = today.getMonth();
            const todayDay = today.getDate();

            const todayStart = new Date(todayYear, todayMonth, todayDay, 0, 0, 0, 0);
            const todayEnd = new Date(todayYear, todayMonth, todayDay, 23, 59, 59, 999);

            console.log("새 일정 날짜 확인 (새 일정 버튼):", {
                today: today.toISOString(),
                todayStart: todayStart.toISOString(),
                todayEnd: todayEnd.toISOString()
            });

            // 카테고리가 없다면 기본 카테고리 찾기
            const defaultCategory = categories.find(cat => cat.name === '기본');
            const defaultCategoryId = defaultCategory ? defaultCategory.id : null;

            setCurrentEvent({
                title: '',
                description: '',
                startTime: todayStart,
                endTime: todayEnd,
                allDay: true,
                category: defaultCategoryId,  // 여기에 기본 카테고리 ID 설정
                color: '#FFFFFF'
            });

            setShowTimeSelection(false);
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
        if (!date) return;

        if (name === 'startTime') {
            // 새로운 시작 날짜를 설정
            const newStart = new Date(date);

            // 현재 시작 시간의 시간/분 정보 유지
            if (showTimeSelection) {
                const currentStart = new Date(currentEvent.startTime);
                newStart.setHours(
                    currentStart.getHours(),
                    currentStart.getMinutes(),
                    0, 0
                );
            } else {
                // 종일 이벤트면 시간은 00:00:00으로 설정
                newStart.setHours(0, 0, 0, 0);
            }

            // 새로운 종료 시간 계산
            let newEnd;

            if (showTimeSelection) {
                // 시간 설정 모드: 현재 종료 시간 유지 검증
                newEnd = new Date(currentEvent.endTime);

                // 종료 날짜가 시작 날짜보다 이전이면 시작 날짜로 설정
                if (newEnd.toDateString() !== newStart.toDateString() &&
                    newEnd < newStart) {
                    newEnd = new Date(newStart);
                    // 종료 시간은 시작 시간 + 1시간
                    newEnd.setHours(newStart.getHours() + 1, newStart.getMinutes(), 0, 0);
                }
            } else {
                // 종일 이벤트 모드: 종료일도 시작일과 같게 설정
                newEnd = new Date(newStart);
                newEnd.setHours(23, 59, 59, 999);
            }

            setCurrentEvent({
                ...currentEvent,
                startTime: newStart,
                endTime: newEnd
            });

        } else if (name === 'endTime') {
            // 새로운 종료 날짜 설정
            const newEnd = new Date(date);

            if (showTimeSelection) {
                // 시간 설정 모드: 현재 종료 시간의 시간/분 정보 유지
                const currentEnd = new Date(currentEvent.endTime);
                newEnd.setHours(
                    currentEnd.getHours(),
                    currentEnd.getMinutes(),
                    0, 0
                );

                // 종료 시간이 시작 시간보다 이전이면 조정
                if (newEnd < currentEvent.startTime) {
                    // 날짜는 유지하고 시간만 시작 시간 + 1시간으로 설정
                    newEnd.setHours(
                        currentEvent.startTime.getHours() + 1,
                        currentEvent.startTime.getMinutes(),
                        0, 0
                    );
                }
            } else {
                // 종일 이벤트 모드: 시간은 23:59:59로 설정
                newEnd.setHours(23, 59, 59, 999);
            }

            setCurrentEvent({
                ...currentEvent,
                endTime: newEnd
            });
        }
    };

    const handleTimeChange = (name, time) => {
        if (!time) return; // 유효하지 않은 시간이면 처리하지 않음

        const newTime = new Date(time);
        const hours = newTime.getHours();
        const minutes = newTime.getMinutes();

        if (name === 'startTime') {
            const currentStart = new Date(currentEvent.startTime);
            // 시간과 분 모두 설정
            currentStart.setHours(hours, minutes, 0, 0);

            // 0시(AM 12시)인 경우 처리 - 자동으로 PM 12시(12시)로 변경
            if (hours === 0) {
                currentStart.setHours(12, minutes, 0, 0);
            }

            setCurrentEvent({
                ...currentEvent,
                startTime: currentStart
            });
        } else { // endTime인 경우
            const currentEnd = new Date(currentEvent.endTime);
            // 시간과 분 모두 설정
            currentEnd.setHours(hours, minutes, 0, 0);

            // 0시(AM 12시)인 경우 처리 - 자동으로 PM 12시(12시)로 변경
            if (hours === 0) {
                currentEnd.setHours(12, minutes, 0, 0);
            }

            // 종료 시간이 시작 시간보다 이전이면 조정하지 않음
            if (currentEnd <= currentEvent.startTime) {
                return;
            }

            setCurrentEvent({
                ...currentEvent,
                endTime: currentEnd
            });
        }
    };

    const handleToggleTimeSelection = (e) => {
        const showTime = e.target.checked;
        setShowTimeSelection(showTime);

        let updatedEvent = { ...currentEvent, allDay: !showTime };

        if (!showTime) {
            // 종일 모드로 전환: 시작 시간은 00:00, 종료 시간은 23:59:59로 설정
            const startDate = new Date(currentEvent.startTime);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(currentEvent.endTime);
            endDate.setHours(23, 59, 59, 999);

            updatedEvent.startTime = startDate;
            updatedEvent.endTime = endDate;
        } else {
            // 시간 선택 모드로 전환
            const now = new Date();
            const currentHour = now.getHours();

            // 현재 시간에서 분을 제외하고 정각으로 설정 (+1시간)
            const startHour = currentHour + 1;

            // AM 12시(0시)인 경우 처리
            const adjustedStartHour = startHour === 0 ? 12 : startHour;

            const startDate = new Date(currentEvent.startTime);
            startDate.setHours(adjustedStartHour, 0, 0, 0);

            // 종료 시간은 시작 시간 + 1시간
            const endDate = new Date(startDate);
            endDate.setHours(adjustedStartHour + 1, 0, 0, 0);

            // 23시에서 24시(다음 날 0시)로 넘어가는 경우 처리
            if (adjustedStartHour >= 23) {
                endDate.setDate(endDate.getDate() + 1);
                endDate.setHours(0, 0, 0, 0);
            }

            updatedEvent.startTime = startDate;
            updatedEvent.endTime = endDate;

            console.log("시간 설정 활성화:", {
                현재시간: now.toLocaleTimeString(),
                조정된시작: startDate.toLocaleTimeString(),
                조정된종료: endDate.toLocaleTimeString()
            });
        }

        setCurrentEvent(updatedEvent);
    };

    const handleSaveEvent = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');

            // 이벤트가 하루 종일인지 확인
            const isAllDay = !showTimeSelection;

            // 날짜 형식화 (YYYY-MM-DD 형식으로)
            const formatDate = (date, withTime = false) => {
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');

                if (withTime) {
                    const hours = String(d.getHours()).padStart(2, '0');
                    const minutes = String(d.getMinutes()).padStart(2, '0');
                    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
                }
                return `${year}-${month}-${day}`;
            };

            // 시작일과 종료일 설정
            let startTimeStr, endTimeStr;

            if (isAllDay) {
                // 종일 이벤트: 시작일은 해당 날짜 00:00:00, 종료일은 해당 날짜 23:59:59
                const startDateOnly = formatDate(currentEvent.startTime);
                const endDateOnly = formatDate(currentEvent.endTime);

                startTimeStr = `${startDateOnly}T00:00:00`;
                endTimeStr = `${endDateOnly}T23:59:59`;
            } else {
                // 시간 설정 이벤트: 시작 및 종료 시간 포함
                startTimeStr = formatDate(currentEvent.startTime, true);
                endTimeStr = formatDate(currentEvent.endTime, true);
            }

            console.log("저장할 이벤트 날짜 확인:", {
                isAllDay,
                startTimeStr,
                endTimeStr,
                currentEvent: {
                    startTime: currentEvent.startTime.toString(),
                    endTime: currentEvent.endTime.toString()
                }
            });

            // 카테고리가 없다면 기본 카테고리 찾기
            if (!currentEvent.category) {
                const defaultCategory = categories.find(cat => cat.name === '기본');
                if (defaultCategory) {
                    currentEvent.category = defaultCategory.id;
                }
            }

            // 백엔드로 전송할 이벤트 데이터 준비 - Date 객체 대신 문자열 사용
            const eventData = {
                ...currentEvent,
                startTime: startTimeStr,
                endTime: endTimeStr,
                allDay: isAllDay,
                category: currentEvent.category ? { id: currentEvent.category } : null
            };

            // Date 객체 제거 (JSON 직렬화 문제 방지)
            delete eventData.start;
            delete eventData.end;

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

            setOpen(false);
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
        // 이벤트 자체 색상이 있으면 사용, 없으면 카테고리 색상 사용
        const backgroundColor = event.color || (event.category ? event.category.color : '#FFFFFF');

        // 배경색이 흰색이면 테두리 추가
        const border = backgroundColor === '#FFFFFF' ? '1px solid #ccc' : 'none';
        const textColor = backgroundColor === '#FFFFFF' ? '#000' : '#fff';

        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                color: textColor,
                border: border
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
                    새 일정
                </Button>
            </Box>

            {loading && <CircularProgress />}

            <Paper elevation={3} sx={{ p: 2 }}>
                <div style={{ height: 'calc(100vh - 220px)' }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleOpenDialog}
                        onSelectSlot={(slotInfo) => handleOpenDialog({ slots: slotInfo, action: 'select' })}
                        selectable
                        popup
                        views={['month', 'week', 'day', 'agenda']}
                    />
                </div>
            </Paper>

            {/* 이벤트 추가/수정 다이얼로그 */}
            <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditMode ? '일정 수정' : '새 일정'}</DialogTitle>
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
                        {/* 날짜/시간 선택 부분 - TimeBlocks 스타일로 변경 */}
                        {!showTimeSelection ? (
                            // 종일 이벤트(시간 설정 없음)
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>날짜</Typography>
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    <Grid item xs={6}>
                                        <DatePicker
                                            label="시작 날짜"
                                            value={currentEvent.startTime}
                                            onChange={(date) => handleDateChange('startTime', date)}
                                            sx={{ width: '100%' }}
                                            inputFormat="yyyy-MM-dd"
                                            renderInput={(params) => <TextField {...params} />}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <DatePicker
                                            label="종료 날짜"
                                            value={currentEvent.endTime}
                                            onChange={(date) => handleDateChange('endTime', date)}
                                            sx={{ width: '100%' }}
                                            minDate={currentEvent.startTime}
                                            inputFormat="yyyy-MM-dd"
                                            renderInput={(params) => <TextField {...params} />}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ) : (
                            // 시간 설정 있음 - 날짜와 시간을 같이 표시하는 방식으로 변경
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>날짜 및 시간</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} mb={2}>
                                        {/* 시작 날짜/시간 */}
                                        <DatePicker
                                            label="시작 날짜"
                                            value={currentEvent.startTime}
                                            onChange={(date) => {
                                                if (date) {
                                                    // 시간 정보는 유지
                                                    const newDate = new Date(date);
                                                    const startTime = new Date(currentEvent.startTime);
                                                    newDate.setHours(
                                                        startTime.getHours(),
                                                        startTime.getMinutes(),
                                                        0, 0
                                                    );
                                                    handleDateChange('startTime', newDate);
                                                }
                                            }}
                                            renderInput={(params) => <TextField {...params} />}
                                            sx={{ width: '50%' }}
                                        />
                                        <TimePicker
                                            label="시작 시간"
                                            value={currentEvent.startTime}
                                            onChange={(time) => handleTimeChange('startTime', time)}
                                            sx={{ width: '50%' }}
                                            ampm={true}
                                            views={['hours', 'minutes']}
                                            ampmInClock
                                            shouldDisableTime={(timeValue, clockType) => {
                                                if (clockType === 'hours' && timeValue === 0) {
                                                    return true;
                                                }
                                                return false;
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        {/* 종료 날짜/시간 */}
                                        <DatePicker
                                            label="종료 날짜"
                                            value={currentEvent.endTime}
                                            onChange={(date) => {
                                                if (date) {
                                                    // 시간 정보는 유지
                                                    const newDate = new Date(date);
                                                    const endTime = new Date(currentEvent.endTime);
                                                    newDate.setHours(
                                                        endTime.getHours(),
                                                        endTime.getMinutes(),
                                                        0, 0
                                                    );
                                                    handleDateChange('endTime', newDate);
                                                }
                                            }}
                                            minDate={currentEvent.startTime}
                                            renderInput={(params) => <TextField {...params} />}
                                            sx={{ width: '50%' }}
                                        />
                                        <TimePicker
                                            label="종료 시간"
                                            value={currentEvent.endTime}
                                            onChange={(time) => handleTimeChange('endTime', time)}
                                            sx={{ width: '50%' }}
                                            ampm={true}
                                            views={['hours', 'minutes']}
                                            ampmInClock
                                            shouldDisableTime={(timeValue, clockType) => {
                                                if (clockType === 'hours' && timeValue === 0) {
                                                    return true;
                                                }
                                                return false;
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}

                        {/* 시간 설정 토글 */}
                        <Box sx={{ mb: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showTimeSelection}
                                        onChange={handleToggleTimeSelection}
                                        name="showTime"
                                    />
                                }
                                label="시간 설정"
                            />
                        </Box>
                    </LocalizationProvider>

                    {/* '기본' 카테고리를 기본값으로 */}
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="category-label">카테고리</InputLabel>
                        <Select
                            labelId="category-label"
                            name="category"
                            value={currentEvent.category || (categories.find(cat => cat.name === '기본')?.id || '')}
                            onChange={handleInputChange}
                            label="카테고리"
                        >
                            {/* '없음' 옵션 제거 */}
                            {categories.map((category) => (
                                <MenuItem key={category.id} value={category.id}>
                                    {category.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {/* 색상 선택 추가*/}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            색상
                        </Typography>
                        <TextField
                            name="color"
                            type="color"
                            value={currentEvent.color || '#FFFFFF'}
                            onChange={handleInputChange}
                            sx={{ width: '100%' }}
                        />
                    </Box>
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