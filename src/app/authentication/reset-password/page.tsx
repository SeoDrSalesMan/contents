"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Card,
  Stack,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import Logo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";
import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const accessToken = searchParams.get('access_token');
  const type = searchParams.get('type');

  useEffect(() => {
    // If this is not a password recovery link, redirect to forgot password
    if (type !== 'recovery' || !accessToken) {
      router.push('/authentication/login');
    }
  }, [type, accessToken, router]);

  const handleResetPassword = async () => {
    if (!password.trim()) {
      setError("Por favor ingresa una nueva contraseña");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Set the session from the URL parameters
      await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: searchParams.get('refresh_token'),
        }),
      });

      // Now update the password using Supabase
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar la contraseña');
      }

      setSuccess(true);
      setError(null);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/authentication/login?message=password_reset_success');
      }, 3000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  if (type !== 'recovery' || !accessToken) {
    return (
      <PageContainer title="Cargando..." description="Cargando">
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Restablecer Contraseña" description="Restablece tu contraseña">
      <Box
        sx={{
          position: "relative",
          "&:before": {
            content: '""',
            background: "radial-gradient(#d2f1df, #d3d7fa, #bad8f4)",
            backgroundSize: "400% 400%",
            animation: "gradient 15s ease infinite",
            position: "absolute",
            height: "100%",
            width: "100%",
            opacity: "0.3",
          },
        }}
      >
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
          <Card
            elevation={9}
            sx={{ p: 4, zIndex: 1, width: "100%", maxWidth: "500px" }}
          >
            <Box display="flex" alignItems="center" justifyContent="center">
              <Logo />
            </Box>

            <Typography variant="h4" fontWeight="700" textAlign="center" mb={1} mt={1}>
              Restablecer Contraseña
            </Typography>

            <Typography variant="body1" textAlign="center" color="text.secondary" mb={3}>
              Ingresa tu nueva contraseña
            </Typography>

            <Stack spacing={2}>
              {success && (
                <Alert severity="success">
                  ¡Contraseña actualizada exitosamente! Serás redirigido al login en unos segundos...
                </Alert>
              )}

              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}

              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  component="label"
                  htmlFor="password"
                  mb="5px"
                >
                  Nueva Contraseña
                </Typography>
                <CustomTextField
                  id="password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  disabled={loading || success}
                  placeholder="Mínimo 6 caracteres"
                />
              </Box>

              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  component="label"
                  htmlFor="confirmPassword"
                  mb="5px"
                >
                  Confirmar Contraseña
                </Typography>
                <CustomTextField
                  id="confirmPassword"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  disabled={loading || success}
                  placeholder="Repite la nueva contraseña"
                />
              </Box>

              <Box mt={3}>
                <Button
                  color="primary"
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleResetPassword}
                  disabled={loading || success}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {loading ? "Actualizando..." : "Actualizar Contraseña"}
                </Button>
              </Box>

              <Box mt={2} textAlign="center">
                <Typography variant="body2">
                  <Link href="/authentication/login" style={{ textDecoration: "none", color: "primary.main" }}>
                    ← Volver al Login
                  </Link>
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default ResetPassword;
