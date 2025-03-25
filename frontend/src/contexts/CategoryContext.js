// src/contexts/CategoryContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
    const [categories, setCategories] = useState([]);
    const [visibleCategories, setVisibleCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { currentUser } = useAuth();
    const API_URL = 'http://localhost:8083';

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const response = await axios.get(`${API_URL}/api/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // 카테고리 가시성 정보 불러오기
            const visibilityResponse = await axios.get(`${API_URL}/api/categories/visibility`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // 카테고리와 가시성 정보 결합
            const categoriesWithVisibility = response.data.map(category => {
                const visibilityItem = visibilityResponse.data.find(
                    item => item.categoryId === category.id
                );

                return {
                    ...category,
                    visible: visibilityItem ? visibilityItem.visible : true
                };
            });

            setCategories(categoriesWithVisibility);

            // 보이는 카테고리 ID 목록 업데이트
            const visible = categoriesWithVisibility
                .filter(cat => cat.visible)
                .map(cat => cat.id);

            setVisibleCategories(visible);
        } catch (error) {
            console.error('카테고리 조회 중 오류 발생:', error);
            setError('카테고리를 불러오는 중 오류가 발생했습니다');

            // 기본 카테고리라도 표시
            const defaultCategories = [{
                id: 0,
                name: '기본',
                visible: true
            }];
            setCategories(defaultCategories);
            setVisibleCategories([0]);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryVisibilityChange = async (categoryId, isVisible) => {
        try {
            const token = localStorage.getItem('auth_token');
            await axios.put(`${API_URL}/api/categories/${categoryId}/visibility`,
                { visible: isVisible },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // 상태 업데이트
            setCategories(prevCategories =>
                prevCategories.map(category =>
                    category.id === categoryId
                        ? { ...category, visible: isVisible }
                        : category
                )
            );

            // 보이는 카테고리 ID 목록 업데이트
            setVisibleCategories(prev => {
                if (isVisible) {
                    return [...prev, categoryId];
                } else {
                    return prev.filter(id => id !== categoryId);
                }
            });
        } catch (error) {
            console.error('카테고리 가시성 변경 중 오류 발생:', error);
        }
    };

    return (
        <CategoryContext.Provider
            value={{
                categories,
                visibleCategories,
                loading,
                error,
                fetchCategories,
                handleCategoryVisibilityChange
            }}
        >
            {children}
        </CategoryContext.Provider>
    );
}

export function useCategories() {
    return useContext(CategoryContext);
}