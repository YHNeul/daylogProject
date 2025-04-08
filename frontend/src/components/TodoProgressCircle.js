// src/components/TodoProgressCircle.js
import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const TodoProgressCircle = ({ progress = 0, size = 40 }) => {
  // 색상 결정 - 진행도에 따라 색상 변경
  const getColor = (progress) => {
    if (progress >= 100) return 'success.main'; // 완료
    if (progress >= 75) return 'info.main';     // 75% 이상
    if (progress >= 50) return 'warning.main';  // 50% 이상
    if (progress >= 25) return 'primary.main';  // 25% 이상
    return 'grey.500';                          // 25% 미만
  };

  const color = getColor(progress);
  const fontSize = size * 0.35; // 원 크기에 비례하는 폰트 크기

  return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
            variant="determinate"
            value={progress}
            size={size}
            thickness={5}
            sx={{ color }}
        />
        {progress > 0 && (
            <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
            >
              <Typography
                  variant="caption"
                  component="div"
                  sx={{ fontSize, fontWeight: 'bold' }}
              >
                {`${Math.round(progress)}%`}
              </Typography>
            </Box>
        )}
      </Box>
  );
};

export default TodoProgressCircle;