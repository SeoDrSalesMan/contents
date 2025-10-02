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

  // Simplificar el componente Profile para evitar timeouts en producción
  // Usar un approach más directo con cache
  const [sessionChecked, setSessionChecked] = useState(false);

  // Función memoizada para obtener datos del usuario
  const getUserData = useCallback(async () => {
    if (sessionChecked) return; // Ya se verificó la sesión

    try {
      setLoading(true);
      console.log('🔍 Profile: Checking auth session...');

      // Timeout de 10 segundos para producción
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('Session check timeout')), 10000);
      });

      const sessionPromise = supabase.auth.getSession();
      const result = await Promise.race([sessionPromise, timeoutPromise]);
      const { data: { session }, error } = result as any;

      if (error || !session?.user) {
        console.log('⚠️ Profile: No session or error:', error?.message);
        setUser(null);
        return;
      }

      const userData = {
        email: session.user.email || '',
        full_name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
        avatar_url: session.user.user_metadata?.avatar_url,
      };

      console.log('✅ Profile: User loaded successfully');
      setUser(userData);

    } catch (error) {
      console.error('❌ Profile: Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
      setSessionChecked(true);
    }
  }, [sessionChecked]);

  useEffect(() => {
    getUserData();

    // Listener simple para cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        window.location.reload(); // Simple reload on auth changes
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        window.location.href = '/authentication/login';
      }
    });

    return () => subscription.unsubscribe();
  }, [getUserData]);

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
