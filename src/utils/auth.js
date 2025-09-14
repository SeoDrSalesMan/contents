// Quick authentication utilities for testing purposes
// This creates a test user to bypass RLS authentication requirements

export const authHelpers = {
  // Initialize a test session
  initializeTestSession: async (supabase) => {
    try {
      console.log('🔄 Checking for existing test session...');

      // First, check if there's already a user
      const { data: existingUser, error: checkError } = await supabase.auth.getUser();

      if (!checkError && existingUser?.user) {
        console.log('✅ Found existing user:', existingUser.user.id);
        return existingUser.user;
      }

      // If no user, create a test user
      console.log('📝 Creating test user session...');

      // We'll use Supabase's sign-up method to create a test user
      // This creates a real session and profile
      const testEmail = `test_${Date.now()}@example.com`;
      const testPassword = 'test123456';

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        console.error('❌ Error creating test user:', error);
        return null;
      }

      console.log('✅ Test user created successfully:', data.user?.id);
      return data.user;

    } catch (error) {
      console.error('❌ Error in test session initialization:', error);
      return null;
    }
  },

  // Get current user safely
  getCurrentUser: async (supabase) => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error getting current user:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('Exception getting current user:', error);
      return null;
    }
  }
};
