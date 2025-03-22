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
    name: yup
        .string()
        .required('이름을 입력해주세요'),
    email: yup
        .string()
        .email('유효한 이메일 형식이 아닙니다')
        .required('이메일을 입력해주세요'),
    password: yup
        .string()
        .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
        .required('비밀번호를 입력해주세요'),
    passwordConfirm: yup
        .string()
        .oneOf([yup.ref('password'), null], '비밀번호가 일치하지 않습니다')
        .required('비밀번호 확인을 입력해주세요'),
});

function Register() {
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const { register } = useAuth();

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            password: '',
            passwordConfirm: '',
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');

            try {
                await register(values.email, values.password, values.name);
                setSuccessMessage('회원가입이 완료되었습니다. 이메일을 확인해주세요.');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setErrorMessage(error.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
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
                        회원가입
                    </Typography>

                    {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
                    {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

                    <form onSubmit={formik.handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    id="name"
                                    name="name"
                                    label="이름"
                                    variant="outlined"
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
                                />
                            </Grid>

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
                                <TextField
                                    fullWidth
                                    id="passwordConfirm"
                                    name="passwordConfirm"
                                    label="비밀번호 확인"
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
                                    disabled={loading}
                                    sx={{ mt: 2 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : '회원가입'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>

                    <Box mt={3} textAlign="center">
                        <Typography variant="body2">
                            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
}

export default Register;