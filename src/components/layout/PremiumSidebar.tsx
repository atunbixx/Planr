"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AttachMoney as BudgetIcon,
  CheckCircle as ChecklistIcon,
  Store as VendorsIcon,
  PhotoLibrary as PhotosIcon,
  Message as MessagesIcon,
  Timeline as TimelineIcon,
  TableRestaurant as TableRestaurantIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Close as CloseIcon,
  Favorite as HeartIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface NavigationItem {
  title: string;
  icon: React.ReactElement;
  path?: string;
  items?: { title: string; path: string }[];
}

interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

const WEDDING_NAV_DATA: NavigationSection[] = [
  {
    label: "WEDDING PLANNING",
    items: [
      {
        title: "Dashboard",
        icon: <DashboardIcon />,
        path: "/dashboard",
      },
      {
        title: "Guest Management",
        icon: <PeopleIcon />,
        path: "/dashboard/guests",
      },
      {
        title: "Budget Tracker",
        icon: <BudgetIcon />,
        path: "/dashboard/budget",
      },
      {
        title: "Checklist",
        icon: <ChecklistIcon />,
        path: "/dashboard/checklist",
      },
      {
        title: "Timeline",
        icon: <TimelineIcon />,
        path: "/dashboard/timeline",
      },
    ],
  },
  {
    label: "VENDORS & SERVICES",
    items: [
      {
        title: "My Vendors",
        icon: <VendorsIcon />,
        path: "/dashboard/vendors",
      },
      {
        title: "Find Vendors",
        icon: <HeartIcon />,
        path: "/vendors",
      },
    ],
  },
  {
    label: "ORGANIZATION",
    items: [
      {
        title: "Table Seating",
        icon: <TableRestaurantIcon />,
        path: "/dashboard/seating",
      },
      {
        title: "Photos",
        icon: <PhotosIcon />,
        path: "/dashboard/photos",
      },
      {
        title: "Messages",
        icon: <MessagesIcon />,
        path: "/dashboard/messages",
      },
    ],
  },
];

interface PremiumSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumSidebar: React.FC<PremiumSidebarProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      onClose();
    }
  };

  const sidebarContent = (
    <Box
      sx={{
        width: 280,
        height: '100%',
        bgcolor: '#FFFFFF',
        borderRight: '1px solid #F1F5F9',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header with Logo */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #722F37 0%, #6B7C32 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '1.25rem',
            }}
          >
            W
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#722F37',
              fontSize: '1.125rem',
            }}
          >
            Wedding Planner
          </Typography>
        </Box>
        
        {isMobile && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        {WEDDING_NAV_DATA.map((section) => (
          <Box key={section.label} sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{
                px: 3,
                mb: 1,
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#94A3B8',
                letterSpacing: '0.1em',
              }}
            >
              {section.label}
            </Typography>
            
            <List sx={{ px: 2 }}>
              {section.items.map((item) => (
                <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
                  {item.items ? (
                    // Expandable item
                    <>
                      <ListItemButton
                        onClick={() => toggleExpanded(item.title)}
                        sx={{
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: 'rgba(114, 47, 55, 0.04)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40, color: '#64748B' }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.title}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: '#475569',
                          }}
                        />
                        {expandedItems.includes(item.title) ? (
                          <ExpandLess sx={{ color: '#64748B' }} />
                        ) : (
                          <ExpandMore sx={{ color: '#64748B' }} />
                        )}
                      </ListItemButton>
                      
                      <Collapse in={expandedItems.includes(item.title)} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {item.items.map((subItem) => (
                            <ListItem key={subItem.title} disablePadding>
                              <ListItemButton
                                onClick={() => handleNavigation(subItem.path)}
                                selected={pathname === subItem.path}
                                sx={{
                                  pl: 6,
                                  borderRadius: 2,
                                  '&:hover': {
                                    bgcolor: 'rgba(114, 47, 55, 0.04)',
                                  },
                                  '&.Mui-selected': {
                                    bgcolor: 'rgba(114, 47, 55, 0.08)',
                                    color: '#722F37',
                                    '&:hover': {
                                      bgcolor: 'rgba(114, 47, 55, 0.12)',
                                    },
                                  },
                                }}
                              >
                                <ListItemText
                                  primary={subItem.title}
                                  primaryTypographyProps={{
                                    fontSize: '0.8125rem',
                                    fontWeight: pathname === subItem.path ? 600 : 400,
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </Collapse>
                    </>
                  ) : (
                    // Simple navigation item
                    <ListItemButton
                      onClick={() => item.path && handleNavigation(item.path)}
                      selected={pathname === item.path}
                      sx={{
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'rgba(114, 47, 55, 0.04)',
                        },
                        '&.Mui-selected': {
                          bgcolor: 'rgba(114, 47, 55, 0.08)',
                          color: '#722F37',
                          '&:hover': {
                            bgcolor: 'rgba(114, 47, 55, 0.12)',
                          },
                          '& .MuiListItemIcon-root': {
                            color: '#722F37',
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40, color: '#64748B' }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: pathname === item.path ? 600 : 500,
                        }}
                      />
                    </ListItemButton>
                  )}
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      {/* Settings at bottom */}
      <Box sx={{ borderTop: '1px solid #F1F5F9', p: 2 }}>
        <ListItemButton
          onClick={() => handleNavigation('/dashboard/settings')}
          selected={pathname === '/dashboard/settings'}
          sx={{
            borderRadius: 2,
            '&:hover': {
              bgcolor: 'rgba(114, 47, 55, 0.04)',
            },
            '&.Mui-selected': {
              bgcolor: 'rgba(114, 47, 55, 0.08)',
              color: '#722F37',
              '& .MuiListItemIcon-root': {
                color: '#722F37',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#64748B' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Settings"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: pathname === '/dashboard/settings' ? 600 : 500,
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        width: isOpen ? 280 : 0,
        transition: 'width 0.2s ease-in-out',
        overflow: 'hidden',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {sidebarContent}
    </Box>
  );
};

export default PremiumSidebar;