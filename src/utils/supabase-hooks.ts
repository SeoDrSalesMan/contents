// Custom hooks for Supabase operations
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase-client'
import { Database } from './supabase-client'

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]

// Generic hook for fetching data from a table
export function useSupabaseTable<T extends keyof Database['public']['Tables']>(
  tableName: T,
  filters?: Record<string, any>
) {
  const [data, setData] = useState<Tables<T>['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase.from(tableName).select('*')

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      const { data: fetchedData, error: fetchError } = await query

      if (fetchError) throw fetchError

      setData(fetchedData || [])
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error(`Error fetching data from ${tableName}:`, err)
    } finally {
      setLoading(false)
    }
  }, [tableName, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

// Hook for real-time subscriptions
export function useSupabaseSubscription<T extends keyof Database['public']['Tables']>(
  tableName: T,
  callback?: (payload: any) => void
) {
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const subscription = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          console.log(`Real-time update on ${tableName}:`, payload)
          callback?.(payload)
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED')
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [tableName, callback])

  return { isSubscribed }
}

// Hook for CRUD operations
export function useSupabaseCrud<T extends keyof Database['public']['Tables']>(tableName: T) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = useCallback(async (data: Tables<T>['Insert']) => {
    try {
      setLoading(true)
      setError(null)

      const { data: result, error: dbError } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single()

      if (dbError) throw dbError

      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tableName])

  const update = useCallback(async (id: string, data: Tables<T>['Update']) => {
    try {
      setLoading(true)
      setError(null)

      const { data: result, error: dbError } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (dbError) throw dbError

      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tableName])

  const remove = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: dbError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (dbError) throw dbError

      return true
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tableName])

  const getById = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data: result, error: dbError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (dbError) throw dbError

      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tableName])

  return {
    loading,
    error,
    create,
    update,
    remove,
    getById
  }
}
