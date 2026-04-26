import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 20px 60px rgba(0,0,0,0.28)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
