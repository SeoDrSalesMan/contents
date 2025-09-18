"use client";
import { useState } from "react";
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

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import Logo from "@/app/(DashboardLayout)/layout/shared/logo/Logo";
import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";
import { authHelpers } from "@/utils/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Por favor ingresa tu email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Por favor ingresa un email válido");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await authHelpers.resetPassword(email.trim());

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Error al enviar el email de recuperación");
      }
    } catch (error) {
      setError("Error inesperado. Por favor intenta de nuevo.");
      console.error("Password reset error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Recuperar Contraseña" description="Recupera tu contraseña">
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
              Recuperar Contraseña
            </Typography>

            <Typography variant="body1" textAlign="center" color="text.secondary" mb={3}>
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
            </Typography>

            {success ? (
              <Stack spacing={2}>
                <Alert severity="success">
                  ¡Email enviado! Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                </Alert>

                <Box mt={3}>
                  <Button
                    color="primary"
                    variant="contained"
                    size="large"
                    fullWidth
                    component={Link}
                    href="/authentication/login"
                  >
                    Volver al Login
                  </Button>
                </Box>
              </Stack>
            ) : (
              <form onSubmit={handleSubmit}>
                <Stack spacing={2}>
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
                      placeholder="tu@email.com"
                      autoComplete="email"
                    />
                  </Box>

                  <Box mt={3}>
                    <Button
                      color="primary"
                      variant="contained"
                      size="large"
                      fullWidth
                      type="submit"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                      {loading ? "Enviando..." : "Enviar Email de Recuperación"}
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
              </form>
            )}
          </Card>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default ForgotPassword;
