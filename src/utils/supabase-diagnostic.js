// Diagnostic utilities for Supabase connection
import { supabase } from './supabase-client'

export const diagnostics = {
  // Test basic connection
  async testConnection() {
    try {
      console.log('🔍 Testing Supabase connection...')

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1)

      if (error) {
        console.error('❌ Connection test failed:', error)
        return false
      } else {
        console.log('✅ Connection test successful!')
        return true
      }
    } catch (error) {
      console.error('❌ Connection test exception:', error)
      return false
    }
  },

  // Test authentication
  async testAuthentication() {
    try {
      console.log('🔍 Testing current authentication...')

      const { data, error } = await supabase.auth.getUser()

      if (error || !data?.user) {
        console.log('⚠️ No user authenticated')
        return false
      } else {
        console.log('✅ User authenticated:', data.user.id)
        return true
      }
    } catch (error) {
      console.error('❌ Authentication test exception:', error)
      return false
    }
  },

  // Test table permissions (RLS)
  async testRLS() {
    try {
      console.log('🔍 Testing RLS permissions...')

      // Try to select with RLS filters
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('name', 'nonexistent-client-for-test')  // This should return empty without error

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
        console.error('❌ RLS test failed:', error)
        return false
      } else {
        console.log('✅ RLS permissions working')
        return true
      }
    } catch (error) {
      console.error('❌ RLS test exception:', error)
      return false
    }
  },

  // Run all diagnostics
  async runAll() {
    console.log('🚀 Starting Supabase diagnostics...')

    const results = {
      connection: await this.testConnection(),
      authentication: await this.testAuthentication(),
      rls: await this.testRLS()
    }

    console.log('📊 Diagnostic results:', results)

    // Summary
    const allPassed = Object.values(results).every(r => r === true)
    console.log(allPassed ? '🎉 All tests PASSED!' : '❌ Some tests FAILED')

    return results
  }
};
