import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
      colors: {
        income: "#1D9E75",
        expense: "#D85A30",
        loan: "#993C1D",
        booking: "#378ADD",
      },
    },
  },
  plugins: [],
};

export default config;
