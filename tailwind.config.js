/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
    extend: {
      dropShadow: {
        'glow': '0 0 10px rgba(255, 255, 255, 0.7)', // Glow terang
        'glow-soft': '0 0 5px rgba(255, 255, 255, 0.3)', // Glow redup
      }
    }
  },
	plugins: [],
	// Add this to reduce CSS file size in production
	future: {
		removeDeprecatedGapUtilities: true,
		purgeLayersByDefault: true,
	},
};