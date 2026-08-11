import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F7F8FA",
        surface: "#FFFFFF",
        border: "#E2E5EA",
        ink: {
          900: "#1B2430",
          600: "#5B6472",
          400: "#8A93A2",
        },
        brand: {
          DEFAULT: "#2F5D62",
          dark: "#234648",
          light: "#E7EFEE",
        },
        estado: {
          pagado: "#3F7D52",
          pagadoBg: "#E8F2EA",
          pendiente: "#B8860B",
          pendienteBg: "#FBF3DF",
          atrasado: "#B3432B",
          atrasadoBg: "#F9E7E2",
          anulado: "#8A8F98",
          anuladoBg: "#EDEEF0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
