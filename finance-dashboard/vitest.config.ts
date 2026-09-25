import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/lib/test/setup.ts'],
		include: ['src/**/*.test.ts']
	}
});
