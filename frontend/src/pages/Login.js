import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
    Container,
    Typography,
    TextField,
    Button,
    Grid,
    Paper,
    Box,
    Alert,
    CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

// 유효성 검증 스키마
const validationSchema = yup.object({
    email: yup
        .string()
        .email('유효한 이메일 형식이 아닙니다')
        .required('이메일을 입력해주세요'),
    password: yup
        .string()
        .required('비밀번호를 입력해주세요'),
});

function Login() {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            // 이 함수가 호출되는지 로그 추가
            console.log('폼 제출 시도:', values);

            setLoading(true);
            setErrorMessage('');

            try {
                console.log('로그인 시도:', values);
                await login(values.email, values.password);
                console.log('로그인 성공, 대시보드로 이동');
                navigate('/dashboard');
            } catch (error) {
                setErrorMessage(error.response?.data?.message || '로그인 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        },
    });

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 8, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom align="center">
                        로그인
                    </Typography>

                    {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

                    <form onSubmit={(e) => {
                        e.preventDefault(); // 기본 제출 동작 방지
                        formik.handleSubmit(e); // formik 제출 함수 호출
                    }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    id="email"
                                    name="email"
                                    label="이메일"
                                    variant="outlined"
                                    value={formik.values.email}
                                    onChange={formik.handleChange}
                                    error={formik.touched.email && Boolean(formik.errors.email)}
                                    helperText={formik.touched.email && formik.errors.email}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    id="password"
                                    name="password"
                                    label="비밀번호"
                                    type="password"
                                    variant="outlined"
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    error={formik.touched.password && Boolean(formik.errors.password)}
                                    helperText={formik.touched.password && formik.errors.password}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    disabled={loading}
                                    sx={{ mt: 2 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : '로그인'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>

                    <Box mt={3} display="flex" justifyContent="space-between">
                        <Typography variant="body2">
                            <Link to="/forgot-password">비밀번호를 잊으셨나요?</Link>
                        </Typography>
                        <Typography variant="body2">
                            <Link to="/register">회원가입</Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default Login;