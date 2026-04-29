import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#ededed",
        card: "#101010",
        border: "#262626",
        primary: "#ffffff",
        secondary: "#1a1a1a",
        muted: "#737373"
      },
    },
  },
  plugins: [],
};
export default config;
