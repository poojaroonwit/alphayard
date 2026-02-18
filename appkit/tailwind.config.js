/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', 'class'], // Enable class-based dark mode
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			supabase: {
  				black: 'var(--bg-default)',
  				dark: 'var(--bg-surface)',
  				border: 'var(--border-default)',
  				hover: 'var(--bg-surface-hover)',
  				text: {
  					main: 'var(--text-primary)',
  					muted: 'var(--text-muted)'
  				}
  			},
  			navy: {
  				start: '#1e40af',
  				end: '#3b82f6'
  			},
  			macos: {
  				blue: {
  					'50': '#1e293b',
  					'100': '#1e40af',
  					'500': '#3b82f6',
  					'600': '#2563eb',
  					'900': '#1e3a8a'
  				},
  				gray: {
  					'50': 'var(--bg-default)',
  					'100': 'var(--bg-surface)',
  					'200': 'var(--border-default)',
  					'300': 'var(--border-hover)',
  					'400': 'var(--text-muted)',
  					'500': 'var(--text-secondary)',
  					'800': 'var(--text-primary)',
  					'900': 'var(--text-primary)'
  				}
  			},
  			primary: {
  				'50': '#1e293b',
  				'500': '#3b82f6',
  				'600': '#2563eb',
  				'700': '#1d4ed8',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': '#1c1917',
  				'500': '#a855f7',
  				'600': '#9333ea',
  				'700': '#7c3aed',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'"DM Sans"',
  				'"IBM Plex Sans Thai"',
  				'sans-serif'
  			],
  			mono: [
  				'SF Mono"',
  				'Monaco',
  				'Cascadia Code"',
  				'Roboto Mono"',
  				'Consolas',
  				'Courier New"',
  				'monospace'
  			]
  		},
  		backdropBlur: {
  			xs: '2px',
  			macos: '20px',
  			'macos-lg': '40px'
  		},
  		boxShadow: {
  			macos: '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.04)',
  			'macos-lg': '0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(0, 0, 0, 0.06)',
  			'macos-xl': '0 12px 48px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.08)',
  			'macos-inset': 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
  			'macos-focus': '0 0 0 3px rgba(13, 126, 255, 0.2)'
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  			'fade-out': 'fadeOut 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  			'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  			'slide-down': 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  			'scale-in': 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  			'scale-out': 'scaleOut 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  			tooltip: 'tooltip 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  			shimmer: 'shimmer 2s linear infinite'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			fadeOut: {
  				'0%': {
  					opacity: '1'
  				},
  				'100%': {
  					opacity: '0'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(8px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			slideDown: {
  				'0%': {
  					transform: 'translateY(-8px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			scaleOut: {
  				'0%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				}
  			},
  			tooltip: {
  				'0%': {
  					transform: 'translateY(4px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-1000px 0'
  				},
  				'100%': {
  					backgroundPosition: '1000px 0'
  				}
  			}
  		},
  		borderRadius: {
  			macos: '12px',
  			'macos-lg': '16px',
  			'macos-xl': '20px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		spacing: {
  			macos: '8px',
  			'macos-lg': '16px',
  			'macos-xl': '24px'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

