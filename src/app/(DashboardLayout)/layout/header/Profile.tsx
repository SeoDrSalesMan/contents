"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  // Constantes para evitar recreaciones
  const CHECK_SESSION_INTERVAL = 300000; // 5 minutos
  const SESSION_TIMEOUT = 30000; // 30 segundos para timeouts
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
    let sessionIntervalId: NodeJS.Timeout;

    const getUserData = async () => {
      // Prevent multiple simultaneous calls
      setLoading(true);
      try {
        console.log('🔍 Profile component: Getting user data...');

        // Much shorter timeout for better UX
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Auth timeout')), 5000); // 5 seconds timeout
        });

        // Get session first - more reliable than getUser for authentication checks
        const sessionPromise = supabase.auth.getSession();

        const sessionResult = await Promise.race([sessionPromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
        const { data: { session }, error: sessionError } = sessionResult;

        clearTimeout(timeoutId);

        if (sessionError || !session?.user) {
          console.log('⚠️ Profile component: No authenticated session');
          setUser(null);
          setLoading(false);
          return;
        }

        const supabaseUser = session.user;

        console.log('🔍 Profile component: Auth result:', {
          hasUser: !!supabaseUser,
          error: sessionError ? String(sessionError) : null,
          email: supabaseUser?.email
        });

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

    // Set up periodic session refresh (every 5 minutes)
    const sessionRefreshInterval = setInterval(async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session && sessionData.session.expires_at) {
          const expiresAt = sessionData.session.expires_at;
          const now = Date.now() / 1000;

          // Refresh if expires in less than 10 minutes
          if (expiresAt - now < 600) {
            console.log('🔄 Refreshing session proactively...');
            const { error } = await supabase.auth.refreshSession();
            if (!error) {
              console.log('✅ Session refreshed successfully');
            } else {
              console.warn('⚠️ Proactive session refresh failed:', error.message);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Periodic session check failed:', error);
      }
    }, 300000); // 5 minutes

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await getUserData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Session token refreshed via auth state change');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionRefreshInterval);
      clearTimeout(timeoutId);
    };
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

      {/*   <MenuItem onClick={handleClose2}>
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
        </MenuItem> */}

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
