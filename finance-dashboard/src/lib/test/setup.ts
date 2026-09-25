import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';

// Reset IndexedDB after each test
afterEach(async () => {
	const dbs = await (window.indexedDB.databases?.() || Promise.resolve([]));
	if (dbs && Array.isArray(dbs)) {
		for (const db of dbs) {
			if (db.name) {
				window.indexedDB.deleteDatabase(db.name);
			}
		}
	}
});
