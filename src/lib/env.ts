export const getEnvVar = (key: string): string | undefined => {
  // First check window._env_ (injected at runtime via Docker entrypoint on Cloud Run)
  if (typeof window !== 'undefined' && (window as any)._env_) {
    const val = (window as any)._env_[key];
    if (val && val !== '') {
      return val;
    }
  }
  // Fallback to build-time environment variables (for local dev or Vercel/Netlify)
  return import.meta.env[key];
};
