import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ylcvizcapupiszqpslpv.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsY3ZpemNhcHVwaXN6cXBzbHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODYwMTIsImV4cCI6MjA4OTE2MjAxMn0.7I1UxItIMMNHSWLfkX7S-9LaJF03jaX4DNt6jim0_8c'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
