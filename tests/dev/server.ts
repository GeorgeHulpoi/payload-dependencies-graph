import express from 'express';
import type { Server } from 'http';
import payload from 'payload';
import { seed } from './seed';

const app = express();

export const start = async (): Promise<Server> => {
	await payload.init({
		local: true,
		secret: 'here-is-a-secret',
		mongoURL: 'mongodb://127.0.0.1/payload-dependency-graph',
		express: app,
	});

	await seed(payload);
	
	return app.listen(3000);
};

// when build.js is launched directly
if (module.id === require.main?.id) {
	start();
}