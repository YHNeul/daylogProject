import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
    password: yup
        .string()
        .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
        .required('비밀번호를 입력해주세요'),
    passwordConfirm: yup
        .string()
        .oneOf([yup.ref('password'), null], '비밀번호가 일치하지 않습니다')
        .required('비밀번호 확인을 입력해주세요'),
});

function ResetPassword() {
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { resetPassword } = useAuth();

    useEffect(() => {
        // URL에서 토큰 파라미터 추출
        const queryParams = new URLSearchParams(location.search);
        const tokenParam = queryParams.get('token');
        if (!tokenParam) {
            setErrorMessage('유효하지 않은 링크입니다. 비밀번호 재설정을 다시 요청해주세요.');
        } else {
            setToken(tokenParam);
        }
    }, [location]);

    const formik = useFormik({
        initialValues: {
            password: '',
            passwordConfirm: '',
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            if (!token) {
                setErrorMessage('유효하지 않은 토큰입니다.');
                return;
            }

            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');

            try {
                await resetPassword(token, values.password);
                setSuccessMessage('비밀번호가 성공적으로 재설정되었습니다.');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setErrorMessage(error.response?.data?.message || '비밀번호 재설정 중 오류가 발생했습니다.');
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
                        비밀번호 재설정
                    </Typography>

                    {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
                    {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

                    {!errorMessage && (
                        <form onSubmit={formik.handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        id="password"
                                        name="password"
                                        label="새 비밀번호"
                                        type="password"
                                        variant="outlined"
                                        value={formik.values.password}
                                        onChange={formik.handleChange}
                                        error={formik.touched.password && Boolean(formik.errors.password)}
                                        helperText={formik.touched.password && formik.errors.password}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        id="passwordConfirm"
                                        name="passwordConfirm"
                                        label="새 비밀번호 확인"
                                        type="password"
                                        variant="outlined"
                                        value={formik.values.passwordConfirm}
                                        onChange={formik.handleChange}
                                        error={formik.touched.passwordConfirm && Boolean(formik.errors.passwordConfirm)}
                                        helperText={formik.touched.passwordConfirm && formik.errors.passwordConfirm}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        disabled={loading || !token}
                                        sx={{ mt: 2 }}
                                    >
                                        {loading ? <CircularProgress size={24} /> : '비밀번호 재설정'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    )}

                    <Box mt={3} textAlign="center">
                        <Typography variant="body2">
                            <Link to="/login">로그인 페이지로 돌아가기</Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default ResetPassword;