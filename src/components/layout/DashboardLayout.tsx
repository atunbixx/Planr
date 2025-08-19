'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AttachMoney as BudgetIcon,
  CheckCircle as ChecklistIcon,
  Store as VendorsIcon,
  PhotoLibrary as PhotosIcon,
  Message as MessagesIcon,
  Timeline as TimelineIcon,
  TableRestaurant as TableRestaurantIcon,
  Favorite as FavoriteIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const drawerWidth = 280;

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Guest Management', icon: <PeopleIcon />, path: '/dashboard/guests' },
  { text: 'Budget Tracker', icon: <BudgetIcon />, path: '/dashboard/budget' },
  { text: 'Checklist', icon: <ChecklistIcon />, path: '/dashboard/checklist' },
  { text: 'Table Seating', icon: <TableRestaurantIcon />, path: '/dashboard/seating' },
  { text: 'Vendors', icon: <VendorsIcon />, path: '/dashboard/vendors' },
  { text: 'Photos', icon: <PhotosIcon />, path: '/dashboard/photos' },
  { text: 'Messages', icon: <MessagesIcon />, path: '/dashboard/messages', badge: 3 },
  { text: 'Timeline', icon: <TimelineIcon />, path: '/dashboard/timeline' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    // Clear auth token/session
    localStorage.removeItem('token');
    router.push('/signin');
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ 
        background: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)',
        color: 'white',
        minHeight: { xs: 64, sm: 80 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FavoriteIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
              Wedding Planner
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Your Perfect Day Awaits
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={pathname === item.path}
              onClick={() => {
                router.push(item.path);
                if (isMobile) handleDrawerToggle();
              }}
              sx={{
                borderRadius: 2,
                mx: 1,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '15',
                  color: theme.palette.primary.main,
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '25',
                  },
                },
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.badge ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: pathname === item.path ? 500 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: 'auto' }} />
      <List sx={{ px: 1, py: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => router.push('/dashboard/settings')}
            sx={{ borderRadius: 2, mx: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 500 }}>
            {menuItems.find(item => item.path === pathname)?.text 
              || (pathname?.startsWith('/dashboard/settings') ? 'Settings' : 'Dashboard')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit" size="large">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 35, height: 35 }}>
                J
              </Avatar>
            </IconButton>
          </Box>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => { handleMenuClose(); router.push('/dashboard/profile'); }}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); router.push('/dashboard/settings'); }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 8, sm: 9 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
