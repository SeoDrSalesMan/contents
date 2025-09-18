// Production authentication helper for seo@doctorsalesman.com user
import { supabase } from '@/utils/supabase-client';

const DEBUG = process.env.NODE_ENV === 'development';

export const authHelpers = {
  // Login with the existing user
  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error.message);
        return { success: false, user: null, error: error.message };
      }

      if (data.user) {
        // Comment out profile creation for now to test login
        // await authHelpers.ensureProfileExistsViaAPI(data.user.id, data.user.email);

        return { success: true, user: data.user, error: null };
      }

      return { success: false, user: null, error: 'Login failed' };

    } catch (error) {
      console.error('Login exception:', error.message);
      return { success: false, user: null, error: error.message };
    }
  },

  // Logout current user
  logout: async () => {
    try {
      await supabase.auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get current session
  getCurrentSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Error getting session:', error);
        return null;
      }

      return session;
    } catch (error) {
      console.error('❌ Exception getting session:', error);
      return null;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('❌ Error getting user:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('❌ Exception getting user:', error);
      return null;
    }
  },

  // Ensure profile exists for foreign key constraints
  ensureProfileExists: async (userId, email) => {
    try {
      console.log('📝 Ensuring profile exists...');

      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!checkError && existingProfile) {
        console.log('✅ Profile already exists');
        return true;
      }

      // Create profile if it doesn't exist
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name: email?.split('@')[0] || 'Usuario',
          avatar_url: null
        }]);

      if (profileError) {
        console.error('❌ Error creating profile:', profileError);
        return false;
      }

      console.log('✅ Profile created successfully');
      return true;

    } catch (error) {
      console.error('❌ Exception ensuring profile exists:', error);
      return false;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const { data: { session } } = supabase.auth.getSession();
    return !!session;
  },

  // Reset password - send reset email
  resetPassword: async (email) => {
    try {
      console.log('📧 Sending password reset email...');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/authentication/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Password reset email sent');
      return { success: true };

    } catch (error) {
      console.error('❌ Exception during password reset:', error);
      return { success: false, error: error.message };
    }
  },

  // Update password (for authenticated users)
  updatePassword: async (newPassword) => {
    try {
      console.log('🔐 Updating password...');

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Password updated successfully');
      return { success: true, user: data.user };

    } catch (error) {
      console.error('❌ Exception during password update:', error);
      return { success: false, error: error.message };
    }
  },

  // Change password for current user
  changePassword: async (currentPassword, newPassword) => {
    try {
      console.log('🔄 Changing password...');

      // First verify current password by attempting to sign in
      const currentUser = await authHelpers.getCurrentUser();
      if (!currentUser || !currentUser.email) {
        return { success: false, error: 'No user session found' };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: currentPassword
      });

      if (signInError) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // If current password is correct, update to new password
      return await authHelpers.updatePassword(newPassword);

    } catch (error) {
      console.error('❌ Exception during password change:', error);
      return { success: false, error: error.message };
    }
  },

  // Ensure profile exists using server-side API (bypasses RLS)
  ensureProfileExistsViaAPI: async (userId, email) => {
    try {
      // Check if profile exists first (using client-side query if possible)
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!checkError && existingProfile) {
        return true;
      }

      // If profile doesn't exist, create it using server-side API
      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (DEBUG) console.error('Error creating profile via API:', result);
        return false;
      }

      return true;

    } catch (error) {
      if (DEBUG) console.error('Exception ensuring profile exists via API:', error);
      return false;
    }
  }
};
