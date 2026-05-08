import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["faiss-node", "@langchain/community"],
};

export default nextConfig;
