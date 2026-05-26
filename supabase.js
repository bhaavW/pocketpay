import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pnywjahdalxhujkotlzj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBueXdqYWhkYWx4aHVqa290bHpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjUxMDksImV4cCI6MjA5NTMwMTEwOX0.AYEJ0HutU4G-YjSiZM8j99tl7s454-p-CdM-kfo3_Ro';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});