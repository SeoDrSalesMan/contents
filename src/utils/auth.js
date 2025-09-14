// Quick authentication utilities for testing purposes
// This creates a test user to bypass RLS authentication requirements

export const authHelpers = {
  // Initialize a test session with profile creation
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

      // Generate a valid test email for Supabase authentication
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const testEmail = `user${randomSuffix}@mailinator.com`;
      const testPassword = 'test123456';

      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (signupError || !signupData.user) {
        console.error('❌ Error creating test user:', signupError);
        return null;
      }

      const user = signupData.user;
      console.log('✅ Test user created:', user.id);

      // 🆔 CRÍTICO: Crear perfil automáticamente
      // El schema requiere que existe un perfil antes de usar created_by
      console.log('📝 Creating user profile...');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,  // Foreign key constraints require this
          full_name: 'Usuario de Prueba',
          avatar_url: null
        }]);

      if (profileError) {
        console.error('❌ Error creating profile:', profileError);
        return null;
      }

      console.log('✅ Profile created successfully for user:', user.id);
      return user;

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
