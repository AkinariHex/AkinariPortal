# Profile layouts

The public profile (`/users/[id]`) renders in one of two layouts, chosen by the
profile owner in `/settings`.

## Data

`users.profile_layout` (text, `'rail' | 'editorial'`, default `'rail'`).
Migration: [`profile-layout.sql`](./profile-layout.sql), run once in the Supabase
SQL editor.

Both `src/app/users/[id]/data.ts` and `src/app/settings/page.tsx` query the
column and silently retry without it when the migration hasn't run yet, falling
back to the default layout. Same defensive pattern as `badges.sort_order`.

## Code map

| File | Role |
| --- | --- |
| `src/lib/profileLayout.ts` | Layout list, `ProfileLayout` type, `normalizeProfileLayout`, and `ProfileLayoutProps` - the contract every layout renders against |
| `src/app/users/[id]/ProfileClient.tsx` | Owns skin state, the edit modal and every mutation; picks the layout and passes `ProfileLayoutProps` |
| `src/components/ProfileRail/ProfileRail.tsx` | Sticky left rail (identity, socials, badges, gear summary) beside the skin library, which has its own text filter |
| `src/components/ProfileEditorial/ProfileEditorial.tsx` | Full-bleed cover behind the navbar, large name, sticky Skins/Setup tabs, two-column skin cards |
| `src/components/ProfileLayoutPicker/ProfileLayoutPicker.tsx` | Settings control - two inline SVG wireframes of the layouts, as a radio group |
| `src/components/ProfileSocials`, `ProfileBadges`, `SkinActions` | Shared between the layouts so a social, badge style or skin action is added once |

Adding a third layout: append it to `PROFILE_LAYOUTS`, extend the SQL check
constraint and the `z.enum` in `saveProfileLayout`, add a preview SVG to
`ProfileLayoutPicker`, and branch on it in `ProfileClient`.

## Behaviour notes

- `users.skin_view` (list/grid) applies to the Rail layout only. Editorial
  always uses its large cards.
- Both layouts pull up under the sticky navbar with `-mt-[4.2em]`; Editorial's
  tab bar sticks at `top-[4.2em]` on desktop and `top-0` on mobile, where the
  navbar is a bottom dock instead.
- Skin anchors (`#<skinId>`, used by the share button) are preserved in both.
- Motion is `opacity`/`transform` only, under 300ms, and disabled under
  `prefers-reduced-motion`.
