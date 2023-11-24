import { createInstance } from '$lib/pocketbase';
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.pb = createInstance();

	// load the store data from the request cookie string
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');
	try {
		// get an up-to-date auth store state by verifying and refreshing the loaded auth model (if any)
		event.locals.pb.authStore.isValid && (await event.locals.pb.collection('users').authRefresh());
	} catch (_) {
		// clear the auth store on failed refresh
		event.locals.pb.authStore.clear();
	}

	const response = await resolve(event);

	// send back the default 'pb_auth' cookie to the client with the latest store state
	response.headers.append(
		'set-cookie',
		event.locals.pb.authStore.exportToCookie({ httpOnly: false, secure: dev ? false : true })
	);

	return response;
};
