import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Container,
    Typography,
    Paper,
    Box,
    Alert,
    CircularProgress,
    Button
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useAuth } from '../contexts/AuthContext';

// 이메일 인증 페이지
function VerifyEmail() {
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const location = useLocation();
    const { verifyEmail } = useAuth();

    useEffect(() => {
        const verifyToken = async () => {
            const queryParams = new URLSearchParams(location.search);
            const token = queryParams.get('token');

            if (!token) {
                setErrorMessage('유효하지 않은 링크입니다. 이메일 인증을 다시 요청해주세요.');
                setLoading(false);
                return;
            }

            try {
                await verifyEmail(token);
                setSuccess(true);
            } catch (error) {
                setErrorMessage(error.response?.data?.message || '이메일 인증 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [location, verifyEmail]);

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        이메일 인증
                    </Typography>

                    {loading ? (
                        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                            <CircularProgress size={60} />
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                이메일 인증 중입니다...
                            </Typography>
                        </Box>
                    ) : success ? (
                        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 80 }} />
                            <Typography variant="h6" color="success" sx={{ mt: 2 }}>
                                이메일 인증이 완료되었습니다!
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                                이제 로그인하여 Daylog 서비스를 이용하실 수 있습니다.
                            </Typography>
                            <Button
                                component={Link}
                                to="/login"
                                variant="contained"
                                color="primary"
                                size="large"
                            >
                                로그인 페이지로 이동
                            </Button>
                        </Box>
                    ) : (
                        <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                            <ErrorOutlineIcon color="error" sx={{ fontSize: 80 }} />
                            <Typography variant="h6" color="error" sx={{ mt: 2 }}>
                                이메일 인증에 실패했습니다
                            </Typography>
                            <Alert severity="error" sx={{ mt: 2, mb: 3 }}>
                                {errorMessage}
                            </Alert>
                            <Button
                                component={Link}
                                to="/login"
                                variant="contained"
                                color="primary"
                                size="large"
                            >
                                로그인 페이지로 돌아가기
                            </Button>
                        </Box>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}

export default VerifyEmail;