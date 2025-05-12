import React from 'react';
import { Box, CircularProgress } from '@mui/material';

interface LoaderProps {
  fullHeight?: boolean;
  size?: number;
}

export const Loader: React.FC<LoaderProps> = ({ fullHeight = true, size = 80 }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: fullHeight ? '100vh' : '60vh',
      width: '100%',
    }}
  >
    <CircularProgress size={size} />
  </Box>
); 