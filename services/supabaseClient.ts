import { createClient } from '@supabase/supabase-js'

/**
 * ⚠️ 重要提醒：
 * supabaseKey 必須是您的「Project API Key (anon/public)」。
 * 它通常是一串非常長的、以 'eyJ' 開頭的字串。
 * 請到 Supabase 控制台 -> Project Settings -> API 頁面複製。
 */

export const supabaseUrl = 'https://rtzwvdwsyupkbuovzkhk.supabase.co'

// 已更新為正確的 Project Anon Key
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0end2ZHdzeXVwa2J1b3Z6a2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2MzQ5MDIsImV4cCI6MjA4MzIxMDkwMn0.fTPDvO4XzrTv5TaTEF3o1mMdHZM4s-xfLvK5ktTYfbQ'

export const supabase = createClient(supabaseUrl, supabaseKey)