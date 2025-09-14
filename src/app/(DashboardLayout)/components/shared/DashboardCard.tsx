import React, { useEffect, useRef } from "react";
import { Card, CardContent, Typography, Stack, Box } from "@mui/material";

type Props = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode | any;
  footer?: React.ReactNode;
  cardheading?: string | React.ReactNode;
  headtitle?: string | React.ReactNode;
  headsubtitle?: string | React.ReactNode;
  children?: React.ReactNode;
  middlecontent?: string | React.ReactNode;
};

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  cardheading,
  headtitle,
  headsubtitle,
  middlecontent,
}: Props) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Limpiar atributos de navegador/extensiones después del montaje
  useEffect(() => {
    if (cardRef.current) {
      // Limpiar cualquier atributo dinámico agregado por extensiones del navegador
      const cleanupAttributes = (element: HTMLElement) => {
        // Lista de atributos típicos agregados por extensiones
        const attributesToRemove = [
          'bis_skin_checked',
          'data-ad-client',
          'data-ad-slot',
          'data-ad-format'
        ];

        attributesToRemove.forEach(attr => {
          if (element.hasAttribute(attr)) {
            element.removeAttribute(attr);
          }
        });

        // Limpiar recursivamente hijos
        Array.from(element.children).forEach(child => {
          if (child instanceof HTMLElement) {
            cleanupAttributes(child);
          }
        });
      };

      cleanupAttributes(cardRef.current);
    }
  }, []);

  return (
    <Card
      ref={cardRef}
      sx={{ padding: 0 }}
      elevation={9}
      variant={undefined}
    >
      {cardheading ? (
        <CardContent>
          <Typography variant="h5">{headtitle}</Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {headsubtitle}
          </Typography>
        </CardContent>
      ) : (
        <CardContent sx={{ p: "30px" }}>
          {title ? (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="space-between"
              alignItems={"center"}
              mb={3}
            >
              <Box>
                {title ? <Typography variant="h5">{title}</Typography> : ""}

                {subtitle ? (
                  <Typography variant="subtitle2" color="textSecondary">
                    {subtitle}
                  </Typography>
                ) : (
                  ""
                )}
              </Box>
              {action}
            </Stack>
          ) : null}

          {children}
        </CardContent>
      )}

      {middlecontent}
      {footer}
    </Card>
  );
};

export default DashboardCard;
