const origin = import.meta.env.VITE_ACTUAL_ORIGIN;

// FIX: VITE_ACTUAL_ORIGIN has a trailing slash (https://host:port/) and
// every call site passes a leading-slash ref (/OrderDetails/...), so the
// naive `${origin}${ref}` concatenation produced a double slash
// (https://host:port//OrderDetails/...) — a URL React Router's route
// matcher doesn't recognize, so every "open in new tab" link 404'd.
export const goToNewBlank = (ref:string) => {
    const base = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const path = ref.startsWith('/') ? ref : `/${ref}`;
    window.open(`${base}${path}`, '_blank')
}
