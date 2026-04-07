export default {
	async fetch(request: Request, env: { ASSETS: Fetcher }): Promise<Response> {
		const assetResponse = await env.ASSETS.fetch(request);

		if (assetResponse.status !== 404) {
			return assetResponse;
		}

		const url = new URL(request.url);
		const acceptsHtml = request.headers.get("accept")?.includes("text/html");
		const isGetRequest = request.method === "GET";
		const looksLikeRoute = !url.pathname.includes(".");

		if (isGetRequest && acceptsHtml && looksLikeRoute) {
			const fallbackRequest = new Request(new URL("/index.html", url), request);
			return env.ASSETS.fetch(fallbackRequest);
		}

		return assetResponse;
	},
};
