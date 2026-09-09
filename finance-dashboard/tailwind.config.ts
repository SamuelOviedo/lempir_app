import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      spacing: {
        '0.75': '3px',
        '1.25': '5px',
        '1.75': '7px',
        '2.25': '9px',
        '2.75': '11px',
        '3.25': '13px',
        '3.75': '15px',
        '4.5': '18px',
        '5.5': '22px',
        '6.5': '26px',
        '7': '28px',
        '9.5': '38px',
        '11': '44px'
      },
      borderRadius: {
        '0.75': '3px',
        '1': '3px',
        '1.5': '6px',
        '1.75': '7px',
        '2': '8px',
        '2.25': '9px',
        '2.5': '10px',
        '2.75': '11px',
        '3': '12px',
        '3.25': '13px',
        '3.5': '14px',
        '4': '18px',
        '5.5': '22px'
      },
      fontSize: {
        'xs': '12px',
        'sm': '13px',
        'base': '14px',
        'lg': '15px'
      },
      textColor: {
        'white/1.4': 'rgba(255,255,255,0.014)',
        'white/5': 'rgba(255,255,255,0.05)',
        'white/6': 'rgba(255,255,255,0.06)',
        'white/7': 'rgba(255,255,255,0.07)',
        'white/22': 'rgba(255,255,255,0.22)',
        'white/30': 'rgba(255,255,255,0.30)',
        'white/42': 'rgba(230,237,243,0.42)',
        'white/60': 'rgba(230,237,243,0.60)',
        'white/62': 'rgba(230,237,243,0.62)',
        'white/90': 'rgba(230,237,243,0.90)'
      },
      backdropBlur: {
        '3xl': '14px',
        '4': '18px'
      },
      boxShadow: {
        'lg': '0 10px 30px rgba(0,0,0,0.45)'
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif']
      },
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(248px, 1fr))'
      }
    }
  }
} satisfies Config;
