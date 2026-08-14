/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-surface-variant": "#43474d",
        "primary": "#001d36",
        "on-secondary-container": "#713f00",
        "secondary": "#8c4f00",
        "background": "#fdf9f2",
        "on-secondary": "#ffffff",
        "on-primary-fixed": "#001d36",
        "secondary-container": "#fda955",
        "tertiary-container": "#68000c",
        "on-tertiary-fixed-variant": "#8f0d19",
        "outline-variant": "#c3c6ce",
        "inverse-surface": "#31302c",
        "surface-container-high": "#ebe8e1",
        "on-primary-fixed-variant": "#2f4865",
        "on-tertiary": "#ffffff",
        "secondary-fixed-dim": "#ffb875",
        "surface-tint": "#47607e",
        "surface-container-highest": "#e6e2db",
        "primary-fixed": "#d1e4ff",
        "surface-container-lowest": "#ffffff",
        "inverse-primary": "#afc9ea",
        "secondary-fixed": "#ffdcc0",
        "surface-dim": "#dddad3",
        "on-background": "#1c1c18",
        "on-primary": "#ffffff",
        "tertiary": "#400005",
        "surface-container": "#f1ede6",
        "surface": "#fdf9f2",
        "on-secondary-fixed": "#2d1600",
        "inverse-on-surface": "#f4f0e9",
        "on-secondary-fixed-variant": "#6b3b00",
        "surface-bright": "#fdf9f2",
        "error-container": "#ffdad6",
        "primary-fixed-dim": "#afc9ea",
        "tertiary-fixed-dim": "#ffb3ae",
        "on-tertiary-fixed": "#410005",
        "error": "#ba1a1a",
        "surface-container-low": "#f7f3ec",
        "on-surface": "#1c1c18",
        "on-error-container": "#93000a",
        "tertiary-fixed": "#ffdad7",
        "on-primary-container": "#819aba",
        "on-tertiary-container": "#ff6462",
        "outline": "#74777e",
        "surface-variant": "#e6e2db",
        "primary-container": "#17324d",
        "on-error": "#ffffff"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "base": "4px",
        "sm": "16px",
        "margin-mobile": "16px",
        "margin-desktop": "32px",
        "md": "24px",
        "xs": "8px",
        "gutter": "24px",
        "xl": "64px",
        "lg": "40px"
      },
      fontFamily: {
        "headline-lg": ["Inter", "sans-serif"],
        "data-value": ["JetBrains Mono", "monospace"],
        "data-label": ["JetBrains Mono", "monospace"],
        "body-lg": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "display-lg": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"]
      },
      fontSize: {
        "headline-lg": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.01em",
            "fontWeight": "600"
          }
        ],
        "data-value": [
          "14px",
          {
            "lineHeight": "18px",
            "fontWeight": "600"
          }
        ],
        "data-label": [
          "12px",
          {
            "lineHeight": "16px",
            "letterSpacing": "0.05em",
            "fontWeight": "500"
          }
        ],
        "body-lg": [
          "18px",
          {
            "lineHeight": "28px",
            "fontWeight": "400"
          }
        ],
        "body-md": [
          "16px",
          {
            "lineHeight": "24px",
            "fontWeight": "400"
          }
        ],
        "display-lg": [
          "48px",
          {
            "lineHeight": "56px",
            "letterSpacing": "-0.02em",
            "fontWeight": "700"
          }
        ],
        "headline-lg-mobile": [
          "28px",
          {
            "lineHeight": "36px",
            "fontWeight": "600"
          }
        ],
        "headline-md": [
          "24px",
          {
            "lineHeight": "32px",
            "fontWeight": "600"
          }
        ],
        "body-sm": [
          "14px",
          {
            "lineHeight": "20px",
            "fontWeight": "400"
          }
        ]
      }
    }
  },
  plugins: [],
}
