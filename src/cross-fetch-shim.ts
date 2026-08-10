const customFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : global.fetch;
export default customFetch;
export const fetch = customFetch;
export const Headers = typeof window !== 'undefined' ? window.Headers : global.Headers;
export const Request = typeof window !== 'undefined' ? window.Request : global.Request;
export const Response = typeof window !== 'undefined' ? window.Response : global.Response;
