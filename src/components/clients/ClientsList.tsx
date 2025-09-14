'use client'

import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useSupabaseTable, useSupabaseCrud } from '@/utils/supabase-hooks'
import { Database } from '@/utils/supabase-client'

type Client = Database['public']['Tables']['clients']['Row']
type ClientInsert = Database['public']['Tables']['clients']['Insert']

export default function ClientsList({ onClientSelect }: { onClientSelect?: (client: Client) => void }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<ClientInsert>({
    id: '',
    nombre: '',
    web: '',
    sector: '',
    propuesta_valor: '',
    publico_objetivo: '',
    keywords: '',
    numero_contenidos_blog: 0,
    frecuencia_mensual_blog: '',
    numero_contenidos_rrss: 0,
    frecuencia_mensual_rrss: '',
    porcentaje_educar: 25,
    porcentaje_inspirar: 25,
    porcentaje_entretener: 25,
    porcentaje_promocionar: 25,
    verticales_interes: '',
    audiencia_no_deseada: '',
    estilo_comunicacion: '',
    tono_voz: ''
  })

  // Hooks
  const { data: clients, loading: loadingClients, error: clientsError, refetch } = useSupabaseTable('clients')
  const { loading: crudLoading, error: crudError, create, update, remove } = useSupabaseCrud('clients')

  const handleSubmit = async () => {
    try {
      if (editingClient) {
        await update(editingClient.id, formData)
      } else {
        const newData = { ...formData, id: crypto.randomUUID() }
        await create(newData)
      }
      handleCloseDialog()
      refetch()
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  const handleNewClient = () => {
    setEditingClient(null)
    setFormData({
      id: '',
      nombre: '',
      web: '',
      sector: '',
      propuesta_valor: '',
      publico_objetivo: '',
      keywords: '',
      numero_contenidos_blog: 0,
      frecuencia_mensual_blog: '',
      numero_contenidos_rrss: 0,
      frecuencia_mensual_rrss: '',
      porcentaje_educar: 25,
      porcentaje_inspirar: 25,
      porcentaje_entretener: 25,
      porcentaje_promocionar: 25,
      verticales_interes: '',
      audiencia_no_deseada: '',
      estilo_comunicacion: '',
      tono_voz: ''
    })
    setDialogOpen(true)
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setFormData({
      ...client,
      updated_at: new Date().toISOString()
    })
    setDialogOpen(true)
  }

  const handleDeleteClient = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar ${nombre}?`)) return
    try {
      await remove(id)
      refetch()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingClient(null)
  }

  const handleInputChange = (field: keyof ClientInsert, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loadingClients) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Gestión de Clientes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleNewClient}>
          Nuevo Cliente
        </Button>
      </Box>

      {(clientsError || crudError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {clientsError?.message || crudError?.message}
        </Alert>
      )}

      {/* Clients Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: 2
        }}
      >
        {(clients as Client[] || []).map((client) => (
          <Card key={client.id}>
            <CardContent>
              <Typography variant="h6" mb={2}>{client.nombre}</Typography>

              {client.sector && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  🏢 {client.sector}
                </Typography>
              )}

              {client.web && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  🌐 {client.web}
                </Typography>
              )}

              {client.keywords && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                  🔍 {client.keywords}
                </Typography>
              )}

              <Box display="flex" justifyContent="flex-end" gap={1}>
                <IconButton size="small" onClick={() => handleEditClient(client)}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClient(client.id, client.nombre)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {!clients?.length && !loadingClients && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" mb={2}>
            No hay clientes registrados
          </Typography>
          <Button variant="contained" onClick={handleNewClient}>
            Crear primer cliente
          </Button>
        </Box>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>

        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              label="Nombre"
              fullWidth
              required
              margin="normal"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
            />

            <TextField
              label="Web"
              fullWidth
              margin="normal"
              value={formData.web}
              onChange={(e) => handleInputChange('web', e.target.value)}
            />

            <TextField
              label="Sector"
              fullWidth
              margin="normal"
              value={formData.sector}
              onChange={(e) => handleInputChange('sector', e.target.value)}
            />

            <TextField
              label="Propuesta de Valor"
              fullWidth
              multiline
              rows={2}
              margin="normal"
              value={formData.propuesta_valor}
              onChange={(e) => handleInputChange('propuesta_valor', e.target.value)}
            />

            <TextField
              label="Público Objetivo"
              fullWidth
              multiline
              rows={2}
              margin="normal"
              value={formData.publico_objetivo}
              onChange={(e) => handleInputChange('publico_objetivo', e.target.value)}
            />

            <TextField
              label="Keywords"
              fullWidth
              margin="normal"
              value={formData.keywords}
              onChange={(e) => handleInputChange('keywords', e.target.value)}
              placeholder="Separadas por comas"
            />

            <Box display="flex" gap={2}>
              <TextField
                label="Contenidos Blog"
                type="number"
                margin="normal"
                value={formData.numero_contenidos_blog}
                onChange={(e) => handleInputChange('numero_contenidos_blog', parseInt(e.target.value) || 0)}
              />

              <TextField
                label="Contenidos RRSS"
                type="number"
                margin="normal"
                value={formData.numero_contenidos_rrss}
                onChange={(e) => handleInputChange('numero_contenidos_rrss', parseInt(e.target.value) || 0)}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={crudLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={crudLoading || !formData.nombre.trim()}
          >
            {crudLoading ? <CircularProgress size={20} /> : (editingClient ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
