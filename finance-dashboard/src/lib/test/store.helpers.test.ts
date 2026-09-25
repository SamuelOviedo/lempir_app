import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	ACCENTS,
	MONTHS_ES,
	dashboard,
	formatTxDate,
	isInRange,
	rangeMonths,
	txMonthIndex
} from '../store';
import { db } from '../db/schema';
import { initializeDatabase } from '../db/migrations';

// Fixed reference date: 24 Sep 2026 (month index 8)
const NOW = new Date(2026, 8, 24);

describe('date helpers (store.ts)', () => {
	it('formatTxDate returns "D mon" in Spanish', () => {
		expect(formatTxDate(NOW)).toBe('24 sep');
		expect(formatTxDate(new Date(2026, 0, 3))).toBe('3 ene');
	});

	it('txMonthIndex parses "D mon", ISO and rejects garbage', () => {
		expect(txMonthIndex('8 sep')).toBe(8);
		expect(txMonthIndex(' 12 DIC ')).toBe(11);
		expect(txMonthIndex('1 septiembre')).toBe(8);
		expect(txMonthIndex('2026-03-15')).toBe(2);
		expect(txMonthIndex('2026-13-01')).toBe(-1);
		expect(txMonthIndex('ayer')).toBe(-1);
		expect(txMonthIndex('')).toBe(-1);
	});

	it('MONTHS_ES has 12 entries round-tripping with txMonthIndex', () => {
		expect(MONTHS_ES).toHaveLength(12);
		MONTHS_ES.forEach((m, i) => expect(txMonthIndex(`1 ${m}`)).toBe(i));
	});

	it('isInRange: Este mes only matches current month', () => {
		expect(isInRange('1 sep', 'Este mes', NOW)).toBe(true);
		expect(isInRange('30 ago', 'Este mes', NOW)).toBe(false);
	});

	it('isInRange: Trimestre covers current and two previous months', () => {
		expect(isInRange('1 sep', 'Trimestre', NOW)).toBe(true);
		expect(isInRange('1 ago', 'Trimestre', NOW)).toBe(true);
		expect(isInRange('1 jul', 'Trimestre', NOW)).toBe(true);
		expect(isInRange('1 jun', 'Trimestre', NOW)).toBe(false);
		expect(isInRange('1 oct', 'Trimestre', NOW)).toBe(false);
	});

	it('isInRange: Trimestre wraps across year boundary', () => {
		const feb = new Date(2026, 1, 10);
		expect(isInRange('5 dic', 'Trimestre', feb)).toBe(true);
		expect(isInRange('5 nov', 'Trimestre', feb)).toBe(false);
	});

	it('isInRange: Año is year-to-date', () => {
		expect(isInRange('1 ene', 'Año', NOW)).toBe(true);
		expect(isInRange('1 sep', 'Año', NOW)).toBe(true);
		expect(isInRange('1 oct', 'Año', NOW)).toBe(false);
	});

	it('isInRange always includes unparseable dates', () => {
		expect(isInRange('???', 'Este mes', NOW)).toBe(true);
	});

	it('rangeMonths scales per range', () => {
		expect(rangeMonths('Este mes', NOW)).toBe(1);
		expect(rangeMonths('Trimestre', NOW)).toBe(3);
		expect(rangeMonths('Año', NOW)).toBe(9);
	});

	it('ACCENTS exposes the four accent ids with hex colors', () => {
		expect(ACCENTS.map((a) => a.id)).toEqual(['green', 'blue', 'purple', 'orange']);
		ACCENTS.forEach((a) => {
			expect(a.acc).toMatch(/^#[0-9a-f]{6}$/i);
			expect(a.accd).toMatch(/^#[0-9a-f]{6}$/i);
		});
	});
});

describe('appearance actions (store.ts)', () => {
	beforeEach(async () => {
		await Promise.all([
			db.transactions.clear(),
			db.categories.clear(),
			db.preferences.clear(),
			db.metadata.clear()
		]);
		await initializeDatabase();
		await dashboard.initialize();
	});

	it('setMode updates state and persists to Dexie', async () => {
		await dashboard.setMode('light');
		expect(get(dashboard).mode).toBe('light');
		expect((await db.preferences.get('user_settings'))?.mode).toBe('light');
	});

	it('setAccent updates state and persists to Dexie', async () => {
		await dashboard.setAccent('purple');
		expect(get(dashboard).accent).toBe('purple');
		expect((await db.preferences.get('user_settings'))?.accent).toBe('purple');
	});

	it('clearDbError resets dbError', () => {
		dashboard.clearDbError();
		expect(get(dashboard).dbError).toBe('');
	});
});
