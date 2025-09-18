"use client";
import React from "react";
import { Box, Container } from "@mui/material";

import AuthLogin from "../auth/AuthLogin";

export default function LoginPage() {
  return (
    <Box suppressHydrationWarning>
      <Container
        maxWidth="sm"
        sx={{
          paddingY: 8,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        suppressHydrationWarning
      >
        <Box suppressHydrationWarning>
          <AuthLogin
            title="Iniciar Sesión"
            subtitle={
              <Box mt={3} suppressHydrationWarning>
                <p>
                  Ingresa con tu cuenta para continuar al dashboard.
                </p>
              </Box>
            }
          />
        </Box>
      </Container>
    </Box>
  );
}
