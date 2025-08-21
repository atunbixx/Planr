'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import PremiumSidebar from './PremiumSidebar';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';

interface MenuItem {
  text: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', path: '/dashboard' },
  { text: 'Guest Management', path: '/dashboard/guests' },
  { text: 'Budget Tracker', path: '/dashboard/budget' },
  { text: 'Checklist', path: '/dashboard/checklist' },
  { text: 'Table Seating', path: '/dashboard/seating' },
  { text: 'My Vendors', path: '/dashboard/vendors' },
  { text: 'Find Vendors', path: '/vendors' },
  { text: 'Photos', path: '/dashboard/photos' },
  { text: 'Messages', path: '/dashboard/messages' },
  { text: 'Timeline', path: '/dashboard/timeline' },
];

export default function PremiumDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, signout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Set sidebar state after hydration to avoid SSR mismatch
  React.useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleSignOut = async () => {
    await signout();
    handleProfileMenuClose();
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === pathname);
    if (currentItem) return currentItem.text;
    
    if (pathname?.startsWith('/dashboard/settings')) return 'Settings';
    if (pathname?.startsWith('/dashboard/vendors/')) return 'Vendor Details';
    
    return 'Dashboard';
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <PremiumSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* ntheme-style Header */}
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            px: { xs: 2, md: 3, xl: 5 },
            py: 2.5,
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          }}
        >
          {/* Mobile menu button */}
          <IconButton
            onClick={handleSidebarToggle}
            sx={{
              display: { lg: 'none' },
              border: '1px solid #E2E8F0',
              borderRadius: 2,
              p: 1,
              '&:hover': {
                bgcolor: '#F8FAFC',
              },
            }}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>

          {/* Page Title Section */}
          <Box sx={{ display: { xs: 'none', xl: 'block' } }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                color: '#722F37',
                mb: 0.5,
                fontSize: '1.5rem',
              }}
            >
              {getCurrentPageTitle()}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#64748B',
                fontWeight: 500,
              }}
            >
              Wedding Planning Dashboard
            </Typography>
          </Box>

          {/* Right side actions */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            flex: 1,
            justifyContent: 'flex-end',
          }}>
            {/* Search Bar */}
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: 300,
              display: { xs: 'none', sm: 'block' }
            }}>
              <Box
                component="input"
                type="search"
                placeholder="Search..."
                sx={{
                  width: '100%',
                  py: 1.5,
                  pl: 6,
                  pr: 2.5,
                  border: '1px solid #E2E8F0',
                  borderRadius: 25,
                  bgcolor: '#F8FAFC',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  '&:focus': {
                    borderColor: '#722F37',
                    bgcolor: '#FFFFFF',
                  },
                  '&::placeholder': {
                    color: '#94A3B8',
                  },
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  pointerEvents: 'none',
                }}
              >
                🔍
              </Box>
            </Box>

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Notifications */}
            <IconButton 
              sx={{ 
                color: '#64748B',
                '&:hover': {
                  bgcolor: '#F8FAFC',
                },
              }}
            >
              <Badge badgeContent={4} color="error">
                <NotificationsIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>

            {/* Profile Menu */}
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0,
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Avatar 
                sx={{ 
                  bgcolor: '#722F37', 
                  width: 32, 
                  height: 32,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={profileMenuAnchor}
          open={Boolean(profileMenuAnchor)}
          onClose={handleProfileMenuClose}
          onClick={handleProfileMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 200,
              borderRadius: 2,
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
          <MenuItem onClick={handleProfileMenuClose}>
            <AccountCircle sx={{ mr: 2 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleSignOut}>
            <LogoutIcon sx={{ mr: 2 }} />
            Sign Out
          </MenuItem>
        </Menu>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            bgcolor: '#FAFBFF',
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}