'use client';

import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  AutoAwesome as PremiumIcon,
  Article as ClassicIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { themeMode, toggleTheme, setThemeMode } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (mode: 'default' | 'premium') => {
    setThemeMode(mode);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Switch Theme" arrow>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            ml: 1,
            backgroundColor: themeMode === 'premium' 
              ? '#722F37'
              : 'transparent',
            color: themeMode === 'premium' ? '#FFFFFF' : 'inherit',
            '&:hover': {
              backgroundColor: themeMode === 'premium'
                ? '#5A252A'
                : 'rgba(0, 0, 0, 0.04)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <PaletteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 280,
            borderRadius: themeMode === 'premium' ? 2 : 0,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Choose Your Theme
          </Typography>
        </Box>
        
        <Divider />
        
        <MenuItem
          onClick={() => handleThemeSelect('default')}
          selected={themeMode === 'default'}
          sx={{
            py: 1.5,
            px: 2,
            borderRadius: themeMode === 'premium' ? 1 : 0,
            mx: themeMode === 'premium' ? 1 : 0,
            my: themeMode === 'premium' ? 0.5 : 0,
          }}
        >
          <ListItemIcon>
            <ClassicIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                Classic Minimalist
              </Typography>
              {themeMode === 'default' && (
                <CheckIcon fontSize="small" color="primary" />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Clean, minimal design with sharp edges
            </Typography>
          </ListItemText>
        </MenuItem>
        
        <MenuItem
          onClick={() => handleThemeSelect('premium')}
          selected={themeMode === 'premium'}
          sx={{
            py: 1.5,
            px: 2,
            borderRadius: themeMode === 'premium' ? 1 : 0,
            mx: themeMode === 'premium' ? 1 : 0,
            my: themeMode === 'premium' ? 0.5 : 0,
          }}
        >
          <ListItemIcon>
            <PremiumIcon 
              fontSize="small" 
              sx={{
                color: '#722F37',
              }}
            />
          </ListItemIcon>
          <ListItemText>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                Million Dollar UI
              </Typography>
              <Chip 
                label="Premium" 
                size="small" 
                sx={{
                  height: 18,
                  fontSize: '0.625rem',
                  backgroundColor: '#722F37',
                  color: '#FFFFFF',
                  fontWeight: 600,
                }}
              />
              {themeMode === 'premium' && (
                <CheckIcon fontSize="small" color="primary" />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              Modern gradients, smooth animations & premium feel
            </Typography>
          </ListItemText>
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Theme preference is saved automatically
          </Typography>
        </Box>
      </Menu>
    </>
  );
};

export default ThemeSwitcher;