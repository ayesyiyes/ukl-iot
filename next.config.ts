import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	async rewrites() {
		return [{ source: "/api/sensor.php", destination: "/api/sensor" }];
	},
};

export default nextConfig;