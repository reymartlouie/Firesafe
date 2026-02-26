import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { toByteArray } from 'base64-js';
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
      .select('username, contact_number, is_admin, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);

    return { ...user, ...profile };
  },

  // Upload avatar image and save public URL to profile
  updateAvatar: async (userId: string, imageUri: string): Promise<string> => {
    const rawExt = imageUri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg';
    const ext = ['jpg', 'jpeg', 'png', 'webp'].includes(rawExt) ? rawExt : 'jpg';
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;

    // Fixed path — upsert always overwrites the same file, no need to delete first
    const path = `${userId}/avatar`;

    // Read image as base64 using the stable legacy API, then convert to bytes
    const base64 = await readAsStringAsync(imageUri, { encoding: EncodingType.Base64 });
    const bytes = toByteArray(base64);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { upsert: true, contentType: mimeType });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    // Store the clean URL without a timestamp so getUser() always returns a stable value.
    // The ?t= cache-bust is added at render time (cachePolicy="none" on expo-image).
    const avatarUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (updateError) throw new Error(updateError.message);

    // Return with a fresh timestamp so the account screen immediately shows the new photo
    return `${avatarUrl}?t=${Date.now()}`;
  },
};

export default authService;