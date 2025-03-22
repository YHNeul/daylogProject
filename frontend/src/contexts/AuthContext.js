import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
// 사용자 인증 상태 관리 위한 컨텍스트
// API 설정
const API_URL = 'http://localhost:8083';
axios.defaults.withCredentials = true; // 세션 기반 인증을 위한 설정

// 인터셉터로 withCredentials 옵션이 적용되도록
axios.interceptors.request.use(
    config => {
        config.withCredentials = true;
        return config;
    },
    error => Promise.reject(error)
);

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 컴포넌트 마운트 시 로그인 상태 확인
    useEffect(() => {
        checkAuthStatus();
    }, []);

    async function checkAuthStatus() {
        try {
            const response = await axios.get(`${API_URL}/api/users/me`, {
                withCredentials: true
            });
            if (response.status === 200) {
                setCurrentUser(response.data);
            }
        } catch (error) {
            console.log('인증 확인 중 오류:', error.response?.status);
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function login(email, password) {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            console.log('로그인 API 호출:', `${API_URL}/api/auth/login`, { email, password });
            setError('');
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password
            });

            // 세션 인증 방식을 사용하므로 별도의 토큰 저장 없이
            // 서버에서 세션 쿠키를 설정합니다.
            console.log('로그인 응답:', response);
            console.log('로그인 쿠키 확인:', document.cookie);
            // 짧은 지연 후 사용자 정보 확인 (세션 설정 시간 고려)
            setTimeout(async () => {
            await checkAuthStatus(); // 로그인 후 사용자 정보 다시 가져오기
            }, 100);
            return response.data;
        } catch (error) {
            setError(error.response?.data?.message || '로그인 중 오류가 발생했습니다.');
            throw error;
        }
    }

    async function register(email, password, name) {
        try {
            setError('');
            const response = await axios.post(`${API_URL}/api/auth/signup`, {
                email,
                password,
                name
            });
            return response.data;
        } catch (error) {
            setError(error.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
            throw error;
        }
    }

    async function logout() {
        try {
            await axios.post(`${API_URL}/api/auth/logout`);
            setCurrentUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async function forgotPassword(email) {
        try {
            setError('');
            const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
            return response.data;
        } catch (error) {
            setError(error.response?.data?.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.');
            throw error;
        }
    }

    async function resetPassword(token, password) {
        try {
            setError('');
            const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
                token,
                password
            });
            return response.data;
        } catch (error) {
            setError(error.response?.data?.message || '비밀번호 재설정 중 오류가 발생했습니다.');
            throw error;
        }
    }

    async function verifyEmail(token) {
        try {
            setError('');
            const response = await axios.get(`${API_URL}/api/auth/verify-email?token=${token}`);
            return response.data;
        } catch (error) {
            setError(error.response?.data?.message || '이메일 인증 중 오류가 발생했습니다.');
            throw error;
        }
    }

    const value = {
        currentUser,
        loading,
        error,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}