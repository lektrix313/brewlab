/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary palette
        cream: {
          DEFAULT: '#F5F0E6',
          soft: '#FAF6EE',
          deep: '#EBE3D2',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          soft: '#3D3D3D',
          muted: '#6E6E6E',
        },
        // Accent palette
        copper: {
          DEFAULT: '#B8633A',
          deep: '#8E4A2A',
          soft: '#F1DCC9',
        },
        wort: {
          DEFAULT: '#D4A04A',
          deep: '#A67C3A',
          soft: '#F5E6C8',
        },
        sage: {
          DEFAULT: '#7A8B6F',
          deep: '#5C6A54',
          soft: '#E2E8DE',
        },
        slate: {
          DEFAULT: '#3F4B57',
          deep: '#2E3842',
          soft: '#D5D9DD',
        },
        critical: '#B8423A',
        // Material3-style surface system from Stitch
        surface: {
          DEFAULT: '#FFF8F6',
          dim: '#E7D7D1',
          bright: '#FFF8F6',
          container: {
            lowest: '#FFFFFF',
            low: '#FFF1EC',
            DEFAULT: '#FBEAE4',
            high: '#F5E5DF',
            highest: '#F0DFD9',
          },
        },
        primary: {
          DEFAULT: '#934620',
          container: '#B15E35',
          fixed: '#FFDBCC',
          'fixed-dim': '#FFB595',
        },
        secondary: {
          DEFAULT: '#7F5600',
          container: '#FEC56B',
          fixed: '#FFDDAE',
          'fixed-dim': '#F5BD64',
        },
        tertiary: {
          DEFAULT: '#00666E',
          container: '#00818B',
          fixed: '#8FF2FD',
          'fixed-dim': '#72D5E0',
        },
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Grotesk', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-xl': ['56px', { lineHeight: '60px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-l': ['40px', { lineHeight: '48px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-m': ['28px', { lineHeight: '36px', fontWeight: '500' }],
        'display-s': ['22px', { lineHeight: '28px', fontWeight: '500' }],
        'body-l': ['17px', { lineHeight: '26px', fontWeight: '400' }],
        'body-m': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-s': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'mono-l': ['36px', { lineHeight: '40px', fontWeight: '500' }],
        'mono-m': ['18px', { lineHeight: '24px', fontWeight: '500' }],
        'mono-s': ['13px', { lineHeight: '18px', fontWeight: '400' }],
      },
      borderRadius: {
        card: '14px',
        button: '10px',
        input: '10px',
      },
      spacing: {
        'stack-item': '16px',
        'stack-section': '32px',
        'card-padding': '20px',
        'margin-mobile': '20px',
      },
    },
  },
  plugins: [],
};
