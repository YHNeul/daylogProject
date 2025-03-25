import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    CssBaseline,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Button,
    Avatar,
    Collapse,
    Checkbox,
    CircularProgress
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChecklistIcon from '@mui/icons-material/Checklist';
import BookIcon from '@mui/icons-material/Book';
import CategoryIcon from '@mui/icons-material/Category';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// 실제 페이지 컴포넌트 임포트
import CalendarPage from './CalendarPage';
import CategoryPage from './CategoryPage';

// 아직 구현되지 않은 페이지를 위한 임시 컴포넌트
const TodoPage = () => <Box p={3}><Typography variant="h4">할 일 목록</Typography></Box>;
const DiaryPage = () => <Box p={3}><Typography variant="h4">다이어리</Typography></Box>;
const ProfilePage = () => <Box p={3}><Typography variant="h4">프로필</Typography></Box>;

const drawerWidth = 240;

function Dashboard() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categoriesOpen, setCategoriesOpen] = useState(true);
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
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
        } catch (error) {
            console.error('카테고리 조회 중 오류 발생:', error);
            setError('카테고리를 불러오는 중 오류가 발생했습니다');

            // 기본 카테고리라도 표시
            setCategories([{
                id: 0,
                name: '기본',
                visible: true
            }]);
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
        } catch (error) {
            console.error('카테고리 가시성 변경 중 오류 발생:', error);
        }
    };

    const handleAddCategory = () => {
        navigate('/dashboard/categories');
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('로그아웃 중 오류가 발생했습니다:', error);
        }
    };

    const toggleCategoriesOpen = () => {
        setCategoriesOpen(!categoriesOpen);
    };

    const menuItems = [
        { text: '캘린더', icon: <CalendarMonthIcon />, path: '/dashboard' },
        { text: '할 일 목록', icon: <ChecklistIcon />, path: '/dashboard/todo' },
        { text: '다이어리', icon: <BookIcon />, path: '/dashboard/diary' },
        { text: '카테고리', icon: <CategoryIcon />, path: '/dashboard/categories' },
        { text: '프로필', icon: <AccountCircleIcon />, path: '/dashboard/profile' },
    ];

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Daylog
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton component={Link} to={item.path}>
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />

            {/* 카테고리 섹션 */}
            <ListItem>
                <ListItemButton onClick={toggleCategoriesOpen}>
                    <ListItemIcon>
                        <CategoryIcon />
                    </ListItemIcon>
                    <ListItemText primary="카테고리" />
                    {categoriesOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
            </ListItem>

            <Collapse in={categoriesOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {loading ? (
                        <ListItem sx={{ pl: 4 }}>
                            <CircularProgress size={20} />
                        </ListItem>
                    ) : (
                        <>
                            {categories.map((category) => (
                                <ListItem key={category.id} sx={{ pl: 4 }}>
                                    <Checkbox
                                        checked={category.visible}
                                        onChange={(e) => handleCategoryVisibilityChange(category.id, e.target.checked)}
                                        color="primary"
                                    />
                                    <ListItemText primary={category.name} />
                                </ListItem>
                            ))}
                            <ListItem sx={{ pl: 4 }}>
                                <ListItemButton onClick={handleAddCategory}>
                                    <ListItemIcon>
                                        <AddIcon />
                                    </ListItemIcon>
                                    <ListItemText primary="카테고리 추가" />
                                </ListItemButton>
                            </ListItem>
                        </>
                    )}
                </List>
            </Collapse>

            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="로그아웃" />
                    </ListItemButton>
                </ListItem>
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Daylog
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ mr: 2 }}>
                            {currentUser?.name || '사용자'}
                        </Typography>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                        </Avatar>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // 모바일 성능 향상을 위한 설정
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
            >
                <Toolbar />
                <Routes>
                    <Route path="/" element={<CalendarPage />} />
                    <Route path="/todo" element={<TodoPage />} />
                    <Route path="/diary" element={<DiaryPage />} />
                    <Route path="/categories" element={<CategoryPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Routes>
            </Box>
        </Box>
    );
}

export default Dashboard;