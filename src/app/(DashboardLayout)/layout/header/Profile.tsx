"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Menu,
  Button,
  IconButton,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
} from "@mui/material";

import { IconListCheck, IconMail, IconPower, IconUser } from "@tabler/icons-react";
import { authHelpers } from "@/utils/auth";
import { supabase } from "@/utils/supabase-client";

interface User {
  email: string;
  full_name?: string;
  avatar_url?: string;
}

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();

  const handleClick2 = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const result = await authHelpers.logout();
      if (result.success) {
        router.push('/authentication/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
      setAnchorEl2(null);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const getUserData = async () => {
      try {
        console.log('🔍 Profile component: Getting user data...');

        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Auth timeout')), 10000); // 10s timeout
        });

        const authPromise = supabase.auth.getUser();

        const authResult = await Promise.race([authPromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.getUser>>;
        const { data: { user: supabaseUser }, error } = authResult;

        clearTimeout(timeoutId);

        console.log('🔍 Profile component: Auth result:', {
          hasUser: !!supabaseUser,
          error: error?.message,
          email: supabaseUser?.email
        });

        if (error || !supabaseUser) {
          console.log('⚠️ Profile component: No authenticated user');
          setUser(null);
          return;
        }

        // Get user profile from profiles table with timeout
        try {
          console.log('🔍 Profile component: Fetching profile data...');

          const profileTimeoutId = setTimeout(() => {
            throw new Error('Profile query timeout');
          }, 5000); // 5s timeout for profile query

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', supabaseUser.id)
            .single();

          clearTimeout(profileTimeoutId);

          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('⚠️ Profile component: Profile query error:', profileError.message);
          }

          const userData = {
            email: supabaseUser.email || '',
            full_name: profile?.full_name || supabaseUser.email?.split('@')[0] || 'Usuario',
            avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
          };

          console.log('✅ Profile component: User data loaded:', {
            email: userData.email,
            fullName: userData.full_name,
            hasAvatar: !!userData.avatar_url
          });

          setUser(userData);
        } catch (profileFetchError) {
          console.warn('⚠️ Profile component: Profile fetch failed, using basic user data:', profileFetchError);

          // Fallback to basic user data if profile fails
          setUser({
            email: supabaseUser.email || '',
            full_name: supabaseUser.email?.split('@')[0] || 'Usuario',
            avatar_url: supabaseUser.user_metadata?.avatar_url,
          });
        }
      } catch (error) {
        console.error('❌ Profile component: Auth error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUserData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await getUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <IconButton disabled>
        <CircularProgress size={24} />
      </IconButton>
    );
  }

  if (!user) {
    return (
      <Button variant="contained" component={Link} href="/authentication/login" disableElevation color="primary">
        Login
      </Button>
    );
  }

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="account menu"
        color="inherit"
        aria-controls="profile-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === "object" && {
            color: "primary.main",
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src={user.avatar_url || "/images/profile/user-1.jpg"}
          alt={user.full_name || "Usuario"}
          sx={{
            width: 35,
            height: 35,
          }}
        >
          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
        </Avatar>
      </IconButton>

      <Menu
        id="profile-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "250px",
          },
        }}
      >
        <Box p={2} borderBottom="1px solid" borderColor="divider">
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {user.full_name || 'Usuario'}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {user.email}
          </Typography>
        </Box>

        <MenuItem onClick={handleClose2}>
          <ListItemIcon>
            <IconUser width={20} />
          </ListItemIcon>
          <ListItemText>Mi Perfil</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleClose2}>
          <ListItemIcon>
            <IconMail width={20} />
          </ListItemIcon>
          <ListItemText>Mi Cuenta</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleClose2}>
          <ListItemIcon>
            <IconListCheck width={20} />
          </ListItemIcon>
          <ListItemText>Mis Tareas</ListItemText>
        </MenuItem>

        <Box mt={1} py={1} px={2}>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={handleLogout}
            disabled={logoutLoading}
            startIcon={logoutLoading ? <CircularProgress size={16} color="inherit" /> : <IconPower width={16} />}
          >
            {logoutLoading ? "Cerrando sesión..." : "Cerrar Sesión"}
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
