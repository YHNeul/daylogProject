import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 인증된 사용자만 접근할수있는 라우팅을 위한 컴포넌트

function PrivateRoute({ children }) {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return currentUser ? children : <Navigate to="/login" />;
}

export default PrivateRoute;