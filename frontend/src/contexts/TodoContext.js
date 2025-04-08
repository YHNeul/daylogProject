import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const TodoContext = createContext();

export function TodoProvider({ children }) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const API_URL = 'http://localhost:8083';

  useEffect(() => {
    if (currentUser) {
      fetchTodos();
      // 외부에서 todos 상태를 업데이트할 수 있는 함수를 window 객체에 추가
      window.updateTodos = (newTodos) => {
        setTodos(newTodos.sort((a, b) => {
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;
          return 0;
        }));
      };
      // 컴포넌트 언마운트 시 정리
      return () => {
        delete window.updateTodos;
      };
    }
  }, [currentUser]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/todos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // 마감일 기준으로 정렬 및 완료된 항목 아래로 이동
      const sortedTodos = response.data.sort((a, b) => {
        // 먼저 완료 여부로 정렬 (완료된 항목은 아래로)
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;

        // 둘 다 완료되었거나 둘 다 완료되지 않은 경우 마감일로 정렬
        // 마감일이 없는 항목은 맨 아래로
        if (!a.dueDate && b.dueDate) return 1;
        if (a.dueDate && !b.dueDate) return -1;
        if (!a.dueDate && !b.dueDate) return 0;

        // 마감일이 빠른 순서대로 정렬
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      setTodos(sortedTodos);
    } catch (error) {
      console.error('할 일 목록 조회 중 오류 발생:', error);
      setError('할 일 목록을 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (todoData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // 색상이 없는 경우 기본값 설정
      if (!todoData.color) {
        todoData.color = '#000000';
      }

      const response = await axios.post(`${API_URL}/api/todos`, todoData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setTodos(prev => {
        const newTodos = [...prev, response.data];
        return newTodos.sort((a, b) => {
          // 완료 여부로 정렬
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;

          // 마감일로 정렬
          if (!a.dueDate && b.dueDate) return 1;
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && !b.dueDate) return 0;

          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      });

      return response.data;
    } catch (error) {
      console.error('할 일 추가 중 오류 발생:', error);
      setError('할 일을 추가하는 중 오류가 발생했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTodo = async (id, todoData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const response = await axios.put(`${API_URL}/api/todos/${id}`, todoData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setTodos(prev => {
        const updatedTodos = prev.map(todo =>
            todo.id === id ? response.data : todo
        );
        return updatedTodos.sort((a, b) => {
          // 완료 여부로 정렬
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;

          // 마감일로 정렬
          if (!a.dueDate && b.dueDate) return 1;
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && !b.dueDate) return 0;

          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      });

      return response.data;
    } catch (error) {
      console.error('할 일 수정 중 오류 발생:', error);
      setError('할 일을 수정하는 중 오류가 발생했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTodoProgress = async (id, progress) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const response = await axios.put(`${API_URL}/api/todos/${id}/progress`,
          { progress },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
      );

      setTodos(prev => {
        const updatedTodos = prev.map(todo =>
            todo.id === id ? response.data : todo
        );
        return updatedTodos.sort((a, b) => {
          // 완료 여부로 정렬
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;

          // 마감일로 정렬
          if (!a.dueDate && b.dueDate) return 1;
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && !b.dueDate) return 0;

          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      });

      return response.data;
    } catch (error) {
      console.error('할 일 진행도 수정 중 오류 발생:', error);
      setError('할 일 진행도를 수정하는 중 오류가 발생했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      await axios.delete(`${API_URL}/api/todos/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setTodos(prev => prev.filter(todo => todo.id !== id));
      return true;
    } catch (error) {
      console.error('할 일 삭제 중 오류 발생:', error);
      setError('할 일을 삭제하는 중 오류가 발생했습니다');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
      <TodoContext.Provider
          value={{
            todos,
            loading,
            error,
            fetchTodos,
            addTodo,
            updateTodo,
            updateTodoProgress,
            deleteTodo
          }}
      >
        {children}
      </TodoContext.Provider>
  );
}

export function useTodos() {
  return useContext(TodoContext);
}