import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // As fotos ficam em public/participantes, então não precisamos de domínios externos.
  // Se um dia você usar URLs de fotos hospedadas fora, adicione o domínio em images.remotePatterns.
};

export default nextConfig;
