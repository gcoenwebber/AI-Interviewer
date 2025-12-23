import type { NextConfig } from "next";
import { config } from "dotenv";
import { join } from "path";

// Load environment variables from the root .env file BEFORE accessing process.env
config({ path: join(process.cwd(), "..", ".env") });

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    NEXT_PUBLIC_BACKEND_URL: process.env.BACKEND_URL || "",
  },
};

export default nextConfig;
