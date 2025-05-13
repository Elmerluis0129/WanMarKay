import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL ?? 'https://wxlqzbqzdyyuefvjuvqv.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4bHF6YnF6ZHl5dWVmdmp1dnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDE5NzAsImV4cCI6MjA2MTY3Nzk3MH0.sq9P846MgZyEsXZeFQIPwDJ8bIlwSN8kdTGlwUEoJpE';

// DEBUG: verificar variables de entorno
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 