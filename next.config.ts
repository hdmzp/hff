import type { NextConfig } from "next";

// GitHub Pages는 https://<계정>.github.io/<저장소>/ 하위 경로로 서비스되므로
// CI에서 BASE_PATH=/careworker 를 넣어 빌드한다. 로컬 개발은 basePath 없음.
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
