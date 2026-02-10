/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // ============= PALETTE COLORI BRAND =============
      colors: {
        // Colori primari
        'primary': '#b41c3c',           // Rosso principale
        'primary-hover': '#1e1e1e',     // Nero per hover
        'secondary': '#d2778a',         // Rosa/Rosato
        
        // Background
        'bg-main': '#fdf5f7',           // Background principale app
        'bg-card': '#fffbfc',           // Background card/contenitori
        
        // Bordi
        'border': '#f0d6da',            // Colore bordi
        
        // Testi
        'text-title': '#1e1e1e',        // Titoli (h1, h2, h3)
        'text-body': '#5f5f5f',         // Testo paragrafi
        'text-subtle': '#9c9c9c',       // Testo secondario/placeholder
        
        // Link
        'link': '#b41c3c',              // Link (stesso del primary)
        
        // Stati funzionali
        'error': '#dc2626',             // Rosso errore
        'warning': '#d97706',           // Arancio warning
        'success': '#16a34a',           // Verde successo
      },
      
      // ============= TIPOGRAFIA =============
      fontFamily: {
        'heading': ['Merriweather', 'serif'],  // Per h1, h2
        'body': ['Inter', 'sans-serif'],       // Per h3+, p, generale
      },
      
      fontWeight: {
        'heading': '900',   // Merriweather bold
        'semibold': '700',  // Inter semibold
        'normal': '400',    // Inter regular
      },
      
      // ============= TRANSIZIONI =============
      transitionDuration: {
        '300': '300ms',
      },
      
      transitionTimingFunction: {
        'smooth': 'ease',
      },
    },
  },
  plugins: [],
}