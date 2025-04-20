import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const TOKEN_KEY = 'auth_token';

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
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            checkAuthStatus();
        } else {
            setLoading(false);
        }
    }, []);

    async function checkAuthStatus() {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            if (!token) {
                setCurrentUser(null);
                setLoading(false);
                return;
            }

            // 토큰을 헤더에 추가
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const response = await axios.get(`${API_URL}/api/users/me`, config);
            if (response.status === 200) {
                setCurrentUser(response.data);
            }
        } catch (error) {
            console.error('인증 확인 중 오류:', error.message);
            // 401 에러면 토큰 제거
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem(TOKEN_KEY);
                setCurrentUser(null);
            }
        } finally {
            setLoading(false);
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

    async function login(email, password) {
        try {
            setError('');
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password
            });

            // JWT 토큰 저장
            const token = response.data.accessToken;
            localStorage.setItem(TOKEN_KEY, token);

            // 사용자 정보 가져오기
            await checkAuthStatus();
            return response.data;
        } catch (error) {
            setError(error.response?.data?.message || '로그인 중 오류가 발생했습니다.');
            throw error;
        }
    }

    async function logout() {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            if (token) {
                // 서버에 로그아웃 요청 보내기 (선택사항)
                await axios.post(`${API_URL}/api/auth/logout`, {}, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            // 서버 요청 실패 시에도 로컬 로그아웃은 진행
            console.error('로그아웃 요청 실패:', error);
        } finally {

            localStorage.removeItem(TOKEN_KEY);
            setCurrentUser(null);
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

    function updateCurrentUser(userData) {
        setCurrentUser(userData);
    }

    const value = {
        currentUser,
        loading,
        error,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        verifyEmail,
        updateCurrentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}