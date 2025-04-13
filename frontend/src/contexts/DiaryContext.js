import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const DiaryContext = createContext();

export function DiaryProvider({ children }) {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const API_URL = 'http://localhost:8083';

  useEffect(() => {
    if (currentUser) {
      fetchDiaries();
    }
  }, [currentUser]);

  const fetchDiaries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/diaries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 날짜 기준 내림차순 정렬 (최신순)
      const sortedDiaries = response.data.sort((a, b) =>
          new Date(b.date) - new Date(a.date)
      );

      setDiaries(sortedDiaries);
    } catch (error) {
      console.error('다이어리 목록 조회 중 오류 발생:', error);
      setError('다이어리 목록을 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const getDiaryById = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/diaries/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('다이어리 조회 중 오류 발생:', error);
      setError('다이어리를 불러오는 중 오류가 발생했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addDiary = async (diaryData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // FormData 생성
      const formData = new FormData();

      // 기본 필드 추가
      formData.append('title', diaryData.title);
      formData.append('content', diaryData.content);

      // 날짜 안전하게 처리
      // DiaryContext.js의 addDiary 함수에서
// 날짜가 무조건 포함되도록 수정
      let dateValue = new Date();
      if (diaryData.date) {
        dateValue = diaryData.date instanceof Date ?
            diaryData.date : new Date(diaryData.date);
      }
      formData.append('date', dateValue.toISOString());

      // 관련 항목 추가 (배열이 아닌 개별 항목으로)
      if (diaryData.relatedEvents && Array.isArray(diaryData.relatedEvents)) {
        diaryData.relatedEvents.forEach(eventId => {
          formData.append('relatedEvents', eventId);
        });
      }

      if (diaryData.relatedTodos && Array.isArray(diaryData.relatedTodos)) {
        diaryData.relatedTodos.forEach(todoId => {
          formData.append('relatedTodos', todoId);
        });
      }

      // 이미지 추가
      if (diaryData.image) {
        formData.append('image', diaryData.image);
      }

      const response = await axios.post(`${API_URL}/api/diaries`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Content-Type 헤더를 자동으로 설정하도록 생략
        }
      });

      setDiaries(prev => [response.data, ...prev]);
      return response.data;
    } catch (error) {
      console.error('다이어리 추가 중 오류 발생:', error);
      setError('다이어리를 추가하는 중 오류가 발생했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateDiary = async (id, diaryData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const formData = new FormData();

      // 기본 필드 추가
      formData.append('title', diaryData.title);
      formData.append('content', diaryData.content);

      // 날짜 안전하게 처리
      const dateValue = diaryData.date instanceof Date ?
          diaryData.date : new Date(diaryData.date || Date.now());
      formData.append('date', dateValue.toISOString());

      // JSON 데이터 추가
      formData.append('title', diaryData.title);
      formData.append('content', diaryData.content);
      formData.append('date', diaryData.date.toISOString());

      // 관련 일정 및 할일 ID 추가
      if (diaryData.relatedEvents && diaryData.relatedEvents.length > 0) {
        diaryData.relatedEvents.forEach((eventId, index) => {
          formData.append(`relatedEvents[${index}]`, eventId);
        });
      }

      if (diaryData.relatedTodos && diaryData.relatedTodos.length > 0) {
        diaryData.relatedTodos.forEach((todoId, index) => {
          formData.append(`relatedTodos[${index}]`, todoId);
        });
      }

      // 이미지 추가 (새 이미지가 있는 경우)
      if (diaryData.image && diaryData.image instanceof File) {
        formData.append('image', diaryData.image);
      }

      // 이미지 삭제 플래그
      if (diaryData.removeImage) {
        formData.append('removeImage', true);
      }

      const response = await axios.put(`${API_URL}/api/diaries/${id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setDiaries(prev => prev.map(diary =>
          diary.id === id ? response.data : diary
      ));

      return response.data;
    } catch (error) {
      console.error('다이어리 수정 중 오류 발생:', error);
      setError('다이어리를 수정하는 중 오류가 발생했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteDiary = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      await axios.delete(`${API_URL}/api/diaries/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setDiaries(prev => prev.filter(diary => diary.id !== id));
      return true;
    } catch (error) {
      console.error('다이어리 삭제 중 오류 발생:', error);
      setError('다이어리를 삭제하는 중 오류가 발생했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 특정 날짜의 다이어리 조회
  const getDiariesByDate = async (date) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // 날짜 형식 변환 (YYYY-MM-DD)
      const formattedDate = date instanceof Date
          ? date.toISOString().split('T')[0]
          : new Date(date).toISOString().split('T')[0];

      const response = await axios.get(`${API_URL}/api/diaries/date/${formattedDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('날짜별 다이어리 조회 중 오류 발생:', error);
      setError('다이어리를 불러오는 중 오류가 발생했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
      <DiaryContext.Provider
          value={{
            diaries,
            loading,
            error,
            fetchDiaries,
            getDiaryById,
            getDiariesByDate,
            addDiary,
            updateDiary,
            deleteDiary
          }}
      >
        {children}
      </DiaryContext.Provider>
  );
}

export function useDiaries() {
  return useContext(DiaryContext);
}