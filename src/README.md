# Dashboard source conventions

## Dependency direction

```text
pages/features -> components/contexts/server -> lib/utils/types
```

- Route components live in `pages/` and compose features; they should not own
  reusable API infrastructure.
- Feature-specific forms and dialogs live under `features/<feature-name>/`.
- HTTP requests use `lib/api.ts`; do not create page-local Axios instances.
- Shared response contracts belong in `server/` or `types/`, not inside JSX.
- User-visible copy must be added to all three files in `locales/`.
- Modal content uses the shared modal primitives in `components/modals/`.

## Adding a page

1. Add the route-level component under `pages/`.
2. Register the route in `App.tsx`.
3. Add desktop and phone navigation only if users need a persistent entry point.
4. Add English, French, and Arabic translations.
5. Verify admin/manager/delivery access behavior.
6. Run `npm run build` at desktop and phone breakpoints.

## API state

Authentication is provided by `contexts/Authentication.tsx`. Orders and
deficiencies use typed hooks under `server/`. Mutations should refresh or update
the owning hook rather than silently creating a second source of truth.
