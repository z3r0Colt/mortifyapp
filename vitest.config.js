export default {
  // Tests never talk to a real Supabase project, even when .env.local has one.
  define: {
    "import.meta.env.VITE_SUPABASE_URL": '""',
    "import.meta.env.VITE_SUPABASE_ANON_KEY": '""',
    "import.meta.env.VITE_VAPID_PUBLIC_KEY": '""',
  },
  test: { include: ["src/**/*.test.{ts,tsx}"] },
};
