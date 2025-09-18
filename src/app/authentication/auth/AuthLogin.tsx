"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Checkbox,
  Alert,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";
import { authHelpers } from "@/utils/auth";

interface loginType {
  title?: string;
  subtitle?: React.ReactNode;
  subtext?: React.ReactNode;
}

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const [email, setEmail] = useState("seo@doctorsalesman.com");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ? decodeURIComponent(searchParams.get('redirect')!) : '/';
  const message = searchParams.get('message');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Por favor ingresa tu email y contraseña");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Attempting login...');
      const result = await authHelpers.login(email.trim(), password.trim());

      console.log('📊 Login result:', result);

      if (result.success && result.user) {
        console.log('✅ Login successful, redirecting to:', redirectTo);
        // Full page reload to force server-side session synchronization
        setTimeout(() => {
          console.log('🔄 Redirecting with full page reload...')
          if (redirectTo === '/') {
            window.location.href = '/';
          } else {
            window.location.href = redirectTo;
          }
        }, 1500); // Give extra time for session propogation
      } else {
        console.error('❌ Login failed:', result.error);
        setError(result.error || "Error de autenticación");
      }
    } catch (error) {
      console.error('❌ Login exception:', error);
      setError("Error inesperado durante el login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box suppressHydrationWarning>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          {message === 'password_reset_success' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Contraseña restablecida exitosamente! Ahora puedes iniciar sesión con tu nueva contraseña.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              component="label"
              htmlFor="email"
              mb="5px"
            >
              Email
            </Typography>
              <CustomTextField
                id="email"
                type="email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
          </Box>

          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              component="label"
              htmlFor="password"
              mb="5px"
            >
              Password
            </Typography>
            <CustomTextField
              id="password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </Box>

          <Stack
            justifyContent="space-between"
            direction="row"
            alignItems="center"
            my={2}
          >
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Mantenerme conectado"
              />
            </FormGroup>
            <Typography
              component={Link}
              href="/authentication/forgot-password"
              fontWeight="500"
              sx={{
                textDecoration: "none",
                color: "primary.main",
              }}
            >
              ¿Olvidaste la contraseña?
            </Typography>
          </Stack>
        </Stack>

        <Box mt={3}>
          <Button
            color="primary"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            type="submit"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </Box>
      </form>

      {subtitle}
    </Box>
  );
};

export default AuthLogin;
