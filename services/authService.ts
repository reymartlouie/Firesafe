import { supabase } from '../lib/supabaseClient';

const authService = {
  // Sign up a new user
  signup: async (username: string, contactNumber: string, password: string) => {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `${username}@firesafe.com`, // Supabase needs an email
      password,
    });

    if (authError) throw new Error(authError.message);

    const userId = authData.user?.id;

    // Insert into profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: userId, username, contact_number: contactNumber }]);

    if (profileError) throw new Error(profileError.message);

    return authData.user;
  },

  // Login user
  login: async (username: string, password: string) => {
    const email = `${username}@firesafe.com`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    // Fetch profile to get admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .maybeSingle();

    return { ...data.user, is_admin: profile?.is_admin ?? false };
  },

  // Logout user
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  // Get current user with profile data
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw new Error(error.message);
    if (!user) throw new Error('No user found');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, contact_number, is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);

    return { ...user, ...profile };
  },
};

export default authService;