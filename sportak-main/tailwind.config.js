/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: "#006dff",
          hover:   "#0057cc",
          light:   "#e6f0ff",
          mid:     "#cce0ff",
        },
        dark:        "#272727",
        "gray-dark": "#3a3a3a",
        "gray-mid":  "#939393",
        "gray-light":"#f4f5f7",
        "gray-border":"#e2e4e9",
        green:       "#18C872",
        orange:      "#ff7a00",
        red:         "#e03131",
        // Status badge colors
        status: {
          active:   { bg: "#d1fae5", text: "#065f46" },
          closed:   { bg: "#f3f4f6", text: "#939393" },
          draft:    { bg: "#fef3c7", text: "#92400e" },
          archived: { bg: "#f3f4f6", text: "#939393" },
        },
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
        xl: "32px",
      },
      boxShadow: {
        sm: "0 1px 4px rgba(0,0,0,.07)",
        md: "0 4px 16px rgba(0,0,0,.10)",
        lg: "0 8px 32px rgba(0,0,0,.13)",
      },
      fontFamily: {
        sans:    ["Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
        display: ["Barlow Condensed", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        brand: "linear-gradient(135deg, #18C872 0%, #006DFF 100%)",
      },
      transitionTimingFunction: {
        "out-expo":  "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
      },
    },
  },
  plugins: [],
}
