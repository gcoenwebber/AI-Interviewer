import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from the root .env file
config({ path: resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_API_KEY: process.env.SUPABASE_API_KEY || "",
  },
};

export default nextConfig;
