import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';

// Auth Context Provider
import {AuthProvider} from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import {CategoryProvider} from './contexts/CategoryContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: '"Noto Sans KR", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
      <ThemeProvider theme={theme}>
        <CssBaseline/>
        <AuthProvider>
          <CategoryProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login/>}/>
                <Route path="/register" element={<Register/>}/>
                <Route path="/forgot-password" element={<ForgotPassword/>}/>
                <Route path="/reset-password" element={<ResetPassword/>}/>
                <Route path="/verify-email" element={<VerifyEmail/>}/>

                <Route
                    path="/dashboard/*"
                    element={
                      <PrivateRoute>
                        <Dashboard/>
                      </PrivateRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
              </Routes>
            </Router>
          </CategoryProvider>
        </AuthProvider>
      </ThemeProvider>
  );
}

export default App;