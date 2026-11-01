import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The inbox loads Supabase lazily; pre-bundle it at dev-server start so the
  // first visit to /private-inbox doesn't hit a stale "Outdated Optimize Dep" 504.
  optimizeDeps: { include: ['@supabase/supabase-js'] },
})
