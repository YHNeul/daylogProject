import React, {useState, useEffect, useMemo} from 'react';
import {Calendar, momentLocalizer} from 'react-big-calendar';
import { useNavigate } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import {
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControlLabel, Switch, Select, MenuItem,
  InputLabel, FormControl, CircularProgress, Snackbar, Alert,
  Grid, Paper, Popover, List, ListItem, ListItemIcon, ListItemText, Divider,
    Slider, Checkbox
} from '@mui/material';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {TimePicker} from '@mui/x-date-pickers/TimePicker';
import axios from 'axios';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChecklistIcon from '@mui/icons-material/Checklist';
import {useAuth} from '../contexts/AuthContext';
import {useCategories} from '../contexts/CategoryContext';
import { useTodos } from '../contexts/TodoContext';
import EventDetailsSidebar from '../components/EventDetailsSidebar';
import { isSameDay } from 'date-fns';

const localizer = momentLocalizer(moment);

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const { todos, updateTodoProgress } = useTodos();
  const [currentDate, setCurrentDate] = useState(new Date());
  const {categories, visibleCategories} = useCategories();
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
  // 할일 모달 관련 상태 추가
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    dueDate: null,
    showInCalendar: true,
    category: null,
    progress: 0,
    color: '#000000' // 기본 검정색
  });
  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const navigate = useNavigate();

  // 오른쪽 사이드바
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarEvents, setSidebarEvents] = useState([]);

  // eslint-disable-next-line no-unused-vars
  const {currentUser} = useAuth();
  const API_URL = 'http://localhost:8083';

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCategories]); // visibleCategories가 변경될 때마다 이벤트 다시 불러오기

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

      console.log('서버에서 받은 이벤트:', response.data);

      // 이벤트 데이터 형식 변환
      const formattedEvents = response.data
      // 두 가지 조건 중 하나를 만족하는 이벤트만 표시:
      // 1. 카테고리가 없는 이벤트
      // 2. 보이는 카테고리에 속한 이벤트
      .filter(event => {
        // 카테고리가 없는 경우 보여주기
        if (!event.category || !event.category.id) {
          return true;
        }

        // 카테고리가 있는 경우 해당 카테고리가 보이는지 확인
        return visibleCategories.includes(event.category.id);
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
        const color = event.color || (event.category ? event.category.color
            : '#FFFFFF');

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





  // 캘린더에 표시할 이벤트 준비 (일정 + Todo)
  const getAllCalendarEvents = useMemo(() => {
    const calendarEvents = events.map(event => ({
      ...event,
      type: 'event' // 이벤트 타입 표시
    }));

    // 캘린더에 표시할 Todo 항목 (showInCalendar가 true인 항목만)
    const todoEvents = todos
    .filter(todo => todo.showInCalendar)
    // 카테고리 필터링
    .filter(todo => {
      // 카테고리가 없는 경우 표시
      if (!todo.category || !todo.category.id) {
        return true;
      }
      // 카테고리가 있는 경우 해당 카테고리가 보이는지 확인
      return visibleCategories.includes(todo.category.id);
    })
    .map(todo => ({
      id: `todo-${todo.id}`,
      title: todo.title, // "[할일]" 접두사 제거
      start: todo.dueDate ? new Date(todo.dueDate) : new Date(),
      end: todo.dueDate ? new Date(todo.dueDate) : new Date(),
      allDay: true,
      color: '#FFFFFF',
      textColor: todo.color || '#000000',
      type: 'todo',
      original: todo // 원본 Todo 데이터 저장
    }));

    return [...calendarEvents, ...todoEvents];
  }, [events, todos, visibleCategories]);

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
      const {start} = event.slots;
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

      // 카테고리 기본값
      const personalCategory = categories.find(cat => cat.name === '개인');
      const personalCategoryId = personalCategory ? personalCategory.id : null;

      setCurrentEvent({
        title: '',
        description: '',
        startTime: newStart,
        endTime: newEnd,
        allDay: true,
        category: personalCategoryId,  // '개인' 카테고리 ID로 설정
        color: '#FFFFFF'
      });

      setShowTimeSelection(false);
      setIsEditMode(false);
    } else if (event && event.action === 'select') { // 날짜 범위 선택
      const {start, end} = event.slots;

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
      const defaultCategory = categories.find(cat => cat.name === '개인');
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
      const todayEnd = new Date(todayYear, todayMonth, todayDay, 23, 59, 59,
          999);

      console.log("새 일정 날짜 확인 (새 일정 버튼):", {
        today: today.toISOString(),
        todayStart: todayStart.toISOString(),
        todayEnd: todayEnd.toISOString()
      });

      // 카테고리가 없다면 기본 카테고리 찾기
      const defaultCategory = categories.find(cat => cat.name === '개인');
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
    const {name, value, checked, type} = e.target;
    setCurrentEvent({
      ...currentEvent,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDateChange = (name, date) => {
    if (!date) {
      return;
    }

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
    if (!time) {
      return;
    } // 유효하지 않은 시간이면 처리하지 않음

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

    let updatedEvent = {...currentEvent, allDay: !showTime};

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

      // 카테고리 기본값
      if (!currentEvent.category) {
        const personalCategory = categories.find(cat => cat.name === '개인');
        if (personalCategory) {
          currentEvent.category = personalCategory.id;
        }
      }

      // 백엔드로 전송할 이벤트 데이터 준비 - Date 객체 대신 문자열 사용
      const eventData = {
        ...currentEvent,
        startTime: startTimeStr,
        endTime: endTimeStr,
        allDay: isAllDay,
        category: currentEvent.category ? {id: currentEvent.category} : null
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

  const handleSaveTodo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // 날짜 처리를 명확하게
      let dueDate = null;
      if (newTodo.dueDate) {
        const date = new Date(newTodo.dueDate);
        // 날짜만 추출하여 시간을 정오로 설정
        dueDate = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            12, 0, 0
        ).toISOString();
      }

      const todoData = {
        title: newTodo.title,
        description: newTodo.description,
        dueDate: dueDate,
        showInCalendar: newTodo.showInCalendar,
        progress: newTodo.progress,
        color: newTodo.color || '#000000',
        category: newTodo.category ? { id: newTodo.category } : null
      };

      await axios.post(`${API_URL}/api/todos`, todoData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess('할일이 성공적으로 추가되었습니다');
      setTodoModalOpen(false);

      // 할일 목록 다시 불러오기
      window.location.reload();
    } catch (error) {
      console.error('할일 저장 중 오류 발생:', error);
      setError('할일 저장 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTodo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const todoData = {
        title: newTodo.title,
        description: newTodo.description,
        dueDate: newTodo.dueDate ? newTodo.dueDate.toISOString() : null,
        showInCalendar: newTodo.showInCalendar,
        progress: newTodo.progress,
        color: newTodo.color,
        category: newTodo.category ? { id: newTodo.category } : null
      };

      await axios.put(`${API_URL}/api/todos/${newTodo.id}`, todoData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 업데이트된 Todo 목록을 가져와서 캘린더에 즉시 반영
      const { data: todos } = await axios.get(`${API_URL}/api/todos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 성공 메시지 표시 및 모달 닫기
      setSuccess('할일이 성공적으로 수정되었습니다');
      setTodoModalOpen(false);

      // 전역 todos 상태 업데이트 (api에서 새로운 데이터 가져옴)
      if (window.updateTodos) {
        window.updateTodos(todos);
      }
    } catch (error) {
      console.error('할일 수정 중 오류 발생:', error);
      setError('할일 수정 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 날짜별 이벤트 필터링 함수
  const getEventsByDate = (date) => {
    const filteredEvents = events.filter(event => {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);

      // 종일 이벤트는 시작일과 종료일 사이의 모든 날짜에 표시
      if (event.allDay) {
        // 종료일은 exclusive이므로 -1일 처리
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() - 1);

        return (
            (date >= startDate && date <= adjustedEndDate) ||
            isSameDay(date, startDate) ||
            isSameDay(date, adjustedEndDate)
        );
      }

      // 시간 지정 이벤트는 시작일에만 표시
      return isSameDay(date, startDate);
    });

    // Todo 항목 중 해당 날짜와 일치하는 것 필터링
    const filteredTodos = todos
    .filter(todo => todo.showInCalendar && todo.dueDate && isSameDay(new Date(todo.dueDate), date))
    .map(todo => ({
      id: `todo-${todo.id}`,
      title: `[할일] ${todo.title}`,
      startTime: new Date(todo.dueDate),
      endTime: new Date(todo.dueDate),
      allDay: true,
      color: todo.completed ? '#4caf50' : '#ff9800',
      description: todo.description,
      progress: todo.progress,
      type: 'todo'
    }));

    return [...filteredEvents, ...filteredTodos];
  };


  // 날짜 클릭 시 사이드바 열기
  const handleDateClick = (date) => {
    setSidebarLoading(true);
    setSelectedDate(date);

    // 해당 날짜의 이벤트 가져오기
    const filteredEvents = getEventsByDate(date);
    setSidebarEvents(filteredEvents);

    setSidebarOpen(true);
    setSidebarLoading(false);
  };

  // 사이드바 닫기
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  // 사이드바가 열려있을 때 캘린더 크기 조정을 위한 스타일
  const calendarContainerStyle = useMemo(() => {
    return {
      height: 'calc(100vh - 220px)',
      transition: 'width 0.3s ease-in-out',
      width: sidebarOpen ? 'calc(100% - 350px)' : '100%',
    };
  }, [sidebarOpen]);


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
    const backgroundColor = event.color || '#FFFFFF';

    // Todo 항목
    if (event.type === 'todo') {
      const completed = event.original?.progress === 100;
      return {
        style: {
          backgroundColor: '#FFFFFF',
          borderRadius: '5px',
          color: event.textColor || '#000000',
          border: 'none',
          opacity: event.original?.progress === 100? 0.5 : 1,
          textDecoration: event.original?.progress === 100 ? 'line-through' : 'none',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '5px'
        }
      };
    }

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
        <Box display="flex" justifyContent="space-between" alignItems="center"
             mb={3}>
          <Typography variant="h4">캘린더</Typography>
          <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog()}
          >
            새 일정
          </Button>
        </Box>

        {loading && <CircularProgress/>}

        <Paper elevation={3} sx={{p: 2}}>
          <div style={calendarContainerStyle}>
            <Calendar
                localizer={localizer}
                events={getAllCalendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{height: '100%'}}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={(event) => {
                  if (event.type === 'todo') {
                    // Todo ID 추출
                    const todoId = event.id.split('-')[1];
                    if (todoId) {
                      // Todo 편집 모달 열기 로직 (아래는 예시)
                      const todo = todos.find(t => t.id === parseInt(todoId));
                      if (todo) {
                        setNewTodo({
                          id: todo.id,
                          title: todo.title,
                          description: todo.description || '',
                          dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
                          showInCalendar: todo.showInCalendar || false,
                          category: todo.category ? todo.category.id : null,
                          progress: todo.progress || 0,
                          color: todo.color || '#000000'
                        });
                        setTodoModalOpen(true);
                      }
                    }
                    return;
                  }
                  // 일반 이벤트는 기존 처리
                  handleOpenDialog(event);
                }}
                onSelectSlot={(slotInfo) => {
                  // 마우스 위치에 컨텍스트 메뉴 표시
                  setContextMenu({
                    x: slotInfo.box.x,
                    y: slotInfo.box.y,
                    slotInfo: slotInfo
                  });
                }}
                onDrillDown={(date) => handleDateClick(date)} // 날짜 클릭 시 처리
                date={currentDate}
                onNavigate={(date) => setCurrentDate(date)}
                selectable
                popup
                views={['month']} // month 뷰만 표시
                defaultView="month" // 기본 month 뷰로 설정
                messages={{
                  today: '오늘',
                  previous: '<',
                  next: '>'
                }}
                // components 속성
                components={{
                  event: (props) => {
                    const { event } = props;
                    if (event.type === 'todo') {
                      return (
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
              <span
                  onClick={(e) => {
                    e.stopPropagation(); // 이벤트 버블링 방지
                    // Todo ID 추출
                    const todoId = event.id.split('-')[1];
                    if (todoId) {
                      try {
                        const token = localStorage.getItem('auth_token');
                        // 현재 progress 값 토글
                        const newProgress = event.original.progress === 100 ? 0 : 100;

                        // API 직접 호출
                        axios.put(`${API_URL}/api/todos/${todoId}/progress`,
                            { progress: newProgress },
                            {
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            }
                        ).then(() => {
                          // 성공 메시지 표시
                          setSuccess(`할일 ${newProgress === 100 ? '완료' : '미완료'} 처리되었습니다`);
                          // 1초 후 새로고침
                          setTimeout(() => {
                            window.location.reload();
                          }, 1000);
                        });
                      } catch (error) {
                        console.error('할일 상태 업데이트 실패:', error);
                        setError('할일 상태 업데이트에 실패했습니다');
                      }
                    }
                  }}
                  style={{
                    marginRight: '4px',
                    width: '16px',
                    height: '16px',
                    border: '1px solid #999',
                    borderRadius: '2px',
                    display: 'inline-block',
                    backgroundColor: event.original.progress === 100 ? '#4caf50' : 'white',
                    cursor: 'pointer'
                  }}
              >
                {event.original.progress === 100 &&
                    <span style={{ color: 'white', fontSize: '12px', display: 'flex', justifyContent: 'center' }}>✓</span>
                }
              </span>
                            <span style={{ color: event.original.color || '#000000' }}>{event.title}</span>
                          </div>
                      );
                    }
                    // 기본 이벤트 렌더링
                    return <span>{event.title}</span>;
                  }
                }}
            />

          </div>
        </Paper>

        {/* 이벤트 상세 사이드바 컴포넌트 */}
        <EventDetailsSidebar
            open={sidebarOpen}
            onClose={handleCloseSidebar}
            selectedDate={selectedDate}
            events={sidebarEvents}
            loading={sidebarLoading}
        />

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
                sx={{mb: 2}}
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
                sx={{mb: 2}}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {/* 날짜/시간 선택 부분 - TimeBlocks 스타일로 변경 */}
              {!showTimeSelection ? (
                  // 종일 이벤트(시간 설정 없음)
                  <Box sx={{mb: 2}}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>날짜</Typography>
                    <Grid container spacing={2} sx={{mb: 2}}>
                      <Grid item xs={6}>
                        <DatePicker
                            label="시작 날짜"
                            value={currentEvent.startTime}
                            onChange={(date) => handleDateChange('startTime',
                                date)}
                            sx={{width: '100%'}}
                            inputFormat="yyyy-MM-dd"
                            renderInput={(params) => <TextField {...params} />}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <DatePicker
                            label="종료 날짜"
                            value={currentEvent.endTime}
                            onChange={(date) => handleDateChange('endTime',
                                date)}
                            sx={{width: '100%'}}
                            minDate={currentEvent.startTime}
                            inputFormat="yyyy-MM-dd"
                            renderInput={(params) => <TextField {...params} />}
                        />
                      </Grid>
                    </Grid>
                  </Box>
              ) : (
                  // 시간 설정 있음 - 날짜와 시간을 같이 표시하는 방식으로 변경
                  <Box sx={{mb: 2}}>
                    <Typography variant="subtitle2" sx={{mb: 1}}>날짜 및
                      시간</Typography>
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
                                const startTime = new Date(
                                    currentEvent.startTime);
                                newDate.setHours(
                                    startTime.getHours(),
                                    startTime.getMinutes(),
                                    0, 0
                                );
                                handleDateChange('startTime', newDate);
                              }
                            }}
                            renderInput={(params) => <TextField {...params} />}
                            sx={{width: '50%'}}
                        />
                        <TimePicker
                            label="시작 시간"
                            value={currentEvent.startTime}
                            onChange={(time) => handleTimeChange('startTime',
                                time)}
                            sx={{width: '50%'}}
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
                            sx={{width: '50%'}}
                        />
                        <TimePicker
                            label="종료 시간"
                            value={currentEvent.endTime}
                            onChange={(time) => handleTimeChange('endTime',
                                time)}
                            sx={{width: '50%'}}
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
              <Box sx={{mb: 2}}>
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
            <FormControl fullWidth sx={{mb: 2}}>
              <InputLabel id="category-label">카테고리</InputLabel>
              <Select
                  labelId="category-label"
                  name="category"
                  value={currentEvent.category || (categories.find(
                      cat => cat.name === '개인')?.id || '')}
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
            <Box sx={{mb: 2}}>
              <Typography variant="subtitle2" gutterBottom>
                색상
              </Typography>
              <TextField
                  name="color"
                  type="color"
                  value={currentEvent.color || '#FFFFFF'}
                  onChange={handleInputChange}
                  sx={{width: '100%'}}
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
            <Button onClick={handleSaveEvent} variant="contained"
                    color="primary">
              {loading ? <CircularProgress size={24}/> : '저장'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 할일 추가 다이얼로그 */}
        <Dialog open={todoModalOpen} onClose={() => setTodoModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{newTodo.id ? '할일 수정' : '새 할일'}</DialogTitle>
          <DialogContent>
            <TextField
                autoFocus
                margin="dense"
                name="title"
                label="제목"
                type="text"
                fullWidth
                value={newTodo.title}
                onChange={(e) => setNewTodo({...newTodo, title: e.target.value})}
                sx={{mb: 2}}
            />

            <TextField
                margin="dense"
                name="description"
                label="설명"
                type="text"
                fullWidth
                multiline
                rows={3}
                value={newTodo.description || ''}
                onChange={(e) => setNewTodo({...newTodo, description: e.target.value})}
                sx={{mb: 2}}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                  label="마감일"
                  value={newTodo.dueDate}
                  onChange={(date) => setNewTodo({...newTodo, dueDate: date})}
                  renderInput={(params) => <TextField {...params} fullWidth sx={{mb: 2}} />}
              />
            </LocalizationProvider>

            <FormControl fullWidth sx={{mb: 2}}>
              <InputLabel id="todo-category-label">카테고리</InputLabel>
              <Select
                  labelId="todo-category-label"
                  name="category"
                  value={newTodo.category || ''}
                  onChange={(e) => setNewTodo({...newTodo, category: e.target.value})}
                  label="카테고리"
              >
                {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{mb: 2}}>
              <Typography variant="subtitle2" gutterBottom>
                진행도
              </Typography>
              <Slider
                  value={newTodo.progress}
                  onChange={(e, value) => setNewTodo({...newTodo, progress: value})}
                  aria-labelledby="progress-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={0}
                  max={100}
              />
            </Box>

            <Box sx={{mb: 2}}>
              <Typography variant="subtitle2" gutterBottom>
                색상 (글자 색상)
              </Typography>
              <TextField
                  name="color"
                  type="color"
                  value={newTodo.color}
                  onChange={(e) => setNewTodo({...newTodo, color: e.target.value})}
                  sx={{width: '100%'}}
              />
            </Box>

            <FormControlLabel
                control={
                  <Switch
                      checked={newTodo.showInCalendar}
                      onChange={(e) => setNewTodo({...newTodo, showInCalendar: e.target.checked})}
                      name="showInCalendar"
                  />
                }
                label="캘린더에 표시"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTodoModalOpen(false)}>취소</Button>
            <Button
                onClick={newTodo.id ? handleUpdateTodo : handleSaveTodo}
                variant="contained"
                color="primary"
                disabled={!newTodo.title}
            >
              {loading ? <CircularProgress size={24}/> : (newTodo.id ? '수정' : '추가')}
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
        {/* 일정/할일 컨텍스트 메뉴 */}
        <Popover
            open={Boolean(contextMenu)}
            onClose={() => setContextMenu(null)}
            anchorReference="anchorPosition"
            anchorPosition={
              contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined
            }
            PaperProps={{ sx: { boxShadow: 3, borderRadius: 1 } }}
        >
          <List sx={{ p: 0 }}>
            <ListItem
                button
                onClick={() => {
                  setContextMenu(null);
                  if (contextMenu) {
                    handleOpenDialog({ slots: contextMenu.slotInfo, action: 'select' });
                  }
                }}
                sx={{ py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CalendarMonthIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="일정 추가" primaryTypographyProps={{ fontSize: 14 }} />
            </ListItem>
            <Divider />
            <ListItem
                button
                onClick={() => {
                  setContextMenu(null);
                  // 할일 추가 모달 열기
                  if (contextMenu) {
                    // 새 할일 데이터 초기화
                    setNewTodo({
                      id: null, // id를 명시적으로 null로 설정하여 새 할일임을 표시
                      title: '',
                      description: '',
                      dueDate: contextMenu.slotInfo.start,
                      showInCalendar: true,
                      category: categories.find(cat => cat.name === '개인')?.id || null,
                      progress: 0,
                      color: '#000000'
                    });
                    setTodoModalOpen(true);
                  }
                }}
                sx={{ py: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ChecklistIcon color="secondary" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="할 일 추가" primaryTypographyProps={{ fontSize: 14 }} />
            </ListItem>
          </List>
        </Popover>
      </Box>
  );
};

export default CalendarPage;