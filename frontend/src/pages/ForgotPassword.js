import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
});

// 비밀번호 찾기
function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const { forgotPassword } = useAuth();

    const formik = useFormik({
        initialValues: {
            email: '',
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');

            try {
                await forgotPassword(values.email);
                setSuccessMessage('비밀번호 재설정 링크가 이메일로 전송되었습니다.');
                formik.resetForm();
            } catch (error) {
                setErrorMessage(error.response?.data?.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.');
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
                        비밀번호 찾기
                    </Typography>

                    <Typography variant="body1" align="center" sx={{ mb: 3 }}>
                        가입한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                    </Typography>

                    {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
                    {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

                    <form onSubmit={formik.handleSubmit}>
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
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    disabled={loading}
                                    sx={{ mt: 2 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : '비밀번호 재설정 링크 전송'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>

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

export default ForgotPassword;