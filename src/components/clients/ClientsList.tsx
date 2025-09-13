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
  IconButton,
  Chip
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useSupabaseTable, useSupabaseCrud, useSupabaseSubscription } from '@/utils/supabase-hooks'

// Define interfaces based on your database schema
interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
  status?: 'active' | 'inactive'
}

// Form for creating/editing clients
interface ClientFormData {
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive'
}

interface ClientsListProps {
  onClientSelect?: (client: Client) => void
}

export default function ClientsList({ onClientSelect }: ClientsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    status: 'active'
  })

  // Hook for reading data
  const { data: clients, loading: loadingClients, error: clientsError, refetch } = useSupabaseTable('clients')

  // Hook for CRUD operations
  const { loading: crudLoading, error: crudError, create, update, remove } = useSupabaseCrud('clients')

  // Real-time updates
  const { isSubscribed } = useSupabaseSubscription('clients', (payload) => {
    console.log('Real-time client update:', payload)
    refetch() // Refresh data when changes occur
  })

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (editingClient) {
        // Update existing client
        await update(editingClient.id, formData)
      } else {
        // Create new client
        await create(formData)
      }

      handleCloseDialog()
      refetch() // Refresh the list
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  // Open dialog for creating new client
  const handleNewClient = () => {
    setEditingClient(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: 'active'
    })
    setDialogOpen(true)
  }

  // Open dialog for editing client
  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      status: client.status || 'active'
    })
    setDialogOpen(true)
  }

  // Handle client deletion
  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      await remove(id)
      refetch() // Refresh the list
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingClient(null)
  }

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Clients Management
          {isSubscribed && (
            <Chip
              label="Live"
              size="small"
              color="success"
              sx={{ ml: 2, verticalAlign: 'middle' }}
            />
          )}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewClient}
        >
          Add Client
        </Button>
      </Box>

      {/* Error Messages */}
      {(clientsError || crudError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {clientsError?.message || crudError?.message}
        </Alert>
      )}

      {/* Clients Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 2
        }}
      >
        {(clients as Client[]).map((client) => (
          <Card key={client.id} sx={{ cursor: onClientSelect ? 'pointer' : 'default' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Typography variant="h6" component="h2" mb={1}>
                  {client.name}
                </Typography>
                <Box>
                  <IconButton size="small" onClick={() => handleEditClient(client)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClient(client.id, client.name)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>

              {client.email && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  📧 {client.email}
                </Typography>
              )}

              {client.phone && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  📞 {client.phone}
                </Typography>
              )}

              <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                <Chip
                  label={client.status || 'active'}
                  color={client.status === 'active' ? 'success' : 'default'}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  Created: {new Date(client.created_at).toLocaleDateString()}
                </Typography>
              </Box>

              {onClientSelect && (
                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => onClientSelect(client)}
                >
                  Select Client
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Empty State */}
      {clients.length === 0 && !loadingClients && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" mb={2}>
            No clients found
          </Typography>
          <Button variant="contained" onClick={handleNewClient}>
            Add your first client
          </Button>
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingClient ? 'Edit Client' : 'Add New Client'}
        </DialogTitle>

        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              required
              margin="normal"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />

            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />

            <TextField
              label="Phone"
              fullWidth
              margin="normal"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />

            <TextField
              label="Status"
              select
              fullWidth
              margin="normal"
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              SelectProps={{
                native: true,
              }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={crudLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={crudLoading || !formData.name.trim()}
          >
            {crudLoading ? <CircularProgress size={20} /> : (editingClient ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
