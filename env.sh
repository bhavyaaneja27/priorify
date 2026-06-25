#!/bin/sh
# This script injects runtime environment variables from Cloud Run into the static Vite app

# Create env-config.js
echo "window._env_ = {" > /usr/share/nginx/html/env-config.js
echo "  VITE_SUPABASE_URL: \"${VITE_SUPABASE_URL}\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_SUPABASE_ANON_KEY: \"${VITE_SUPABASE_ANON_KEY}\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_GEMINI_API_KEY: \"${VITE_GEMINI_API_KEY}\"," >> /usr/share/nginx/html/env-config.js
echo "}" >> /usr/share/nginx/html/env-config.js
