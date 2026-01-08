import { createClient } from '@supabase/supabase-js'

// 這是妳的雲端倉庫地址
export const supabaseUrl = 'https://rtzwvdwsyupkbuovzkhk.supabase.co'

// 這裡請填入妳剛才在 Supabase 網站複製的那串超長 sb_publishable... 開頭的亂碼
export const supabaseKey = 'sb_publishable_kb38CrjY3PFE7SGW3_Djjg_M9vWzitL'

export const supabase = createClient(supabaseUrl, supabaseKey)