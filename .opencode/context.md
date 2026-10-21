## Objective (current)
- Frontend-side spec bugs fixed ✅ DONE
- Delete flows now agree with the notification (dialog no longer contradicts the toast) ✅ DONE
- **Toast coverage: every action now notifies** ✅ DONE
- **204 proxy crash fixed** ✅ DONE
- **Refresh buttons on every admin page** ✅ DONE
- **Certificate-type tabs → dropdown** ✅ DONE
- **Template logo/watermark must match the auxiliary** ✅ DONE
- **All 14 spec bugs + the 8 remaining ones fixed (Option A chosen)** ✅ DONE
- **Items 20–26 frontend halves done** ✅ DONE
- Landing page hero stats restyled to match reference site (Ruzworth) ✅ DONE

## Live swagger facts (fetched from the deployed API)
`https://jcs-certificate-system-production.up.railway.app/swagger/v1/swagger.json`
— JCS.API, OpenAPI 3.0.1, v1.0, 55 endpoints, 21 schemas.

- **Paging params exist on exactly 4 GETs**: `/api/Participants`,
  `/api/Certificates`, `/api/Events`, `/api/AuditLogs` — each with
  `Page`, `PageSize`, `SafePage`, `SafePageSize` (bare `integer` query params,
  **no descriptions, defaults or min/max**).
- **No endpoint documents its 200 response body** and there is no `PagedResult`
  schema — the envelope shape is undocumented.
- **~15 endpoints the frontend calls have NO paging at all**, including
  `GET /api/CertificateTemplates` (the whole Studio list),
  `GET /api/AdminAssignments`, `GET /api/Events/auxiliary/{auxiliary}`,
  `GET /api/Participants/event/{id}`, `GET /api/Certificates/event/{id}`,
  `GET /api/Participants/my`, `GET /api/Certificates/my`,
  `GET /api/members/tajneed/{id}`, `GET /api/dashboard/summary`.
  → the frontend **must** tolerate a bare array; it is not a bug.
- **Global security is `{"Bearer":[]}` with no per-endpoint overrides** — so
  *every* endpoint needs a token, including `Certificates/verify/{number}`.
  There is **no public verify endpoint** today.
- **No endpoint returns the current user's profile/role** — the role only comes
  from the login response, so it cannot be "refreshed from the server" without
  a new backend endpoint.
- `OrganizationalLevel` enum = Mulk | Ilaqa | Dila | Jamaat | District.
  `CreateParticipantDto` has **no** mulk/district field (jamaat, dila, ilaqa only)
  — so the field must be added to the Participant entity/DTO by the backend.
- The 4 paging params are undocumented; `SafePage`/`SafePageSize` are
  presumably the clamped variants.

## Items 20–26 — frontend halves (this session)
- **#20 deleteGeneralAdmin audit** — already done (writes 'General Admin
  Revoked'). Backend soft-delete still outstanding.
- **#21 mulkOrDistrict** — `Participant.mulkOrDistrict?: string` added
  (`types/index.ts`), read in the participant mapper and in
  `lookupMemberProfile`. **Not** added to the POST payload — the backend DTO
  rejects unknown fields, so it is read-only until the backend adds it.
- **#22 session validation** — new `authApi.validateSession(memberId)` calls
  the server and returns false only on **401** (a network failure never signs
  a valid admin out). `AuthContext` calls it on mount and ends the sign-in if
  the server rejects the session. The role itself can only come from the login
  response until a `/api/auth/me` endpoint exists.
- **#23 certificate verification** — `certificatesApi.verifyByNumber` now
  always calls the server; the local-cache fallback is gone.
- **#24 verification hash** — the mapper no longer invents one for a
  server-issued certificate (`verificationHash: bStr(raw.verificationHash || raw.qrCodeUrl)`).
  The deterministic FNV-1a `stableVerificationHash()` is now used **only** where
  the frontend itself creates a certificate (the offline demo path). The QR code
  encodes the certificate *number*, not the hash, so nothing broke.
- **#25 pagination** — one shared helper `getAllBackendPages(path)` now reads
  every list endpoint and understands both the envelope and a bare array. All
  list reads route through it: Participants, Certificates, Events,
  AuditLogs, AdminAssignments, Events/auxiliary, Participants/event,
  Certificates/event, Participants/my, Certificates/my. A bare array from a
  documented-paged endpoint logs a warning (the list may be incomplete)
  instead of silently truncating. `auditApi.getLogs` was rewritten onto the
  shared helper.
- **#26 proxy timeout** — `app/api/backend/[...path]/route.ts` now uses
  30s by default and **180s** for PDF/bulk routes
  (`/generate`, `/generate-all`, `/download-all-pdf`, `/upload-csv`,
  `/upload-excel`, `/preview`). The login proxy goes 15s → 30s.

**Verification:** `npx eslint .` 0 errors · `npx tsc --noEmit` clean ·
`npx next build` compiles.

## Security & hardening pass (Option A — this session)
User chose **Option A** for both open decisions.

**Logout / session:**
- `services/api.ts` — new exported `clearLocalRecords()` removes the cached
  personal-record keys `jcs_v2_participants`, `jcs_v2_certificates`,
  `jcs_v2_audit_logs`, `jcs_v2_users`, `jcs_v2_events`.
  **`jcs_v2_template_overrides` is deliberately KEPT** (admin's designs, not
  member data).
- `context/AuthContext.tsx` — logout now calls `clearLocalRecords()`, calls
  `setUser(null)`, resets `activeAuxiliary`, and does
  `history.replaceState(null,'','/login')` so Back can't restore a signed-in view.
- `context/AuthContext.tsx` — session restore now **reads `jcs_expires_at`** and
  refuses to restore an expired session (and clears the dead session keys).
- `components/layout/DashboardShell.tsx` — redirects to `/login` when `user` is null.
- `next.config.ts` — `Cache-Control: no-store, must-revalidate` on HTML routes
  only (source excludes `_next/static`, `_next/image` and anything with a file
  extension, so fonts/images stay cacheable). Keeps the page out of bfcache.

**Audit trail honesty:**
- `services/api.ts` — `auditApi.getLogsWithStatus()` returns `{ logs, stale }`.
  `getLogs()` is kept as a thin wrapper (no ripple). `stale` is true whenever the
  result came from the local cache.
- `app/(dashboard)/audit/page.tsx` — amber banner when stale: "Showing cached
  entries — the server could not be reached…".

**Error handling / proxy:**
- `services/backendClient.ts` — `backendDownload` errors and non-JSON bodies
  both route through `friendlyErrorMessage`; the raw server text and
  "Download failed (401)" no longer reach the UI. The thrown error carries
  `status`.
- `app/api/backend/[...path]/route.ts` + `app/api/auth/login/route.ts` — the 502
  body no longer includes `targetUrl` or the raw cause; both stay in the
  server-side `console.error` (including `causeMsg`).

**No more invented data:**
- `services/api.ts` `loginReal` — email comes from the registry or is empty;
  the fabricated `@jamaat.org` address is gone. `BackendLoginResponse.profile`
  gained an optional `email`.
- `types/index.ts` — `Event.eventType` is now optional; the mapper no longer
  defaults it to `'Ijtema'`. The events form requires a type and shows
  "Event type not set" on cards with no type.
- `services/api.ts` — `stableVerificationHash()` (FNV-1a) replaces
  `Math.random()` for `verificationHash`, so a certificate's verification link
  (and its QR code) is stable across reads.
- `app/(dashboard)/admins/page.tsx` — the display fallback `'National HQ'` is
  replaced with "Not specified".

**Login a11y (`app/login/page.tsx`):** `htmlFor`/`id` on both labels, `name`,
`autoComplete="username"` / `"current-password"`, `autoCapitalize`+`spellCheck`
on Member ID, `aria-pressed` on the show/hide button, and the error is now
`role="alert" aria-live="assertive"`.

**Verification:** `npx eslint .` 0 errors · `npx tsc --noEmit` clean ·
`npx next build` compiles.

## Template logo / watermark bug (this session)
Symptom: the Ansarullah template previewed correctly (circular "MAJLIS ANSARULLAH
NIGERIA" seal as the header emblem AND the big watermark) but became the
generic Ahmadiyya mosque once opened in the editor.

Verified with the assets: `public/ansar.jpg` **is** the circular Ansarullah
seal; `public/ahmadiyyah_logo.png` is the mosque. `public/certificate-design1/2.png`
are the green/gold frame artworks used by RoyalWave/EmeraldFrame.

Root cause — `logoUrl` was overloaded:
- `mapBackendTemplateToTemplate` set `logoUrl` from
  `raw.filePath || raw.backgroundImagePath || config.logoUrl` and defaulted it to
  `'/ahmadiyyah_logo.png'`. So it was **always truthy**, and the artwork chain
  `template.logoUrl || AUXILIARY_LOGO_SRC[logoType] || AUXILIARY_LOGO_SRC[auxiliary]`
  never reached the auxiliary emblem.
- `backgroundImagePath` is the certificate BACKGROUND artwork, not a logo.
- `normalizeTemplateSignature` only corrected `logoType` when `!tmpl.logoUrl`,
  which never held.
- **A `forEach` bug I introduced:** `merged.forEach(normalizeTemplateSignature)`
  discarded the returned objects, so `getAll` never applied the normalization
  at all (the offline path used `.map` correctly).

Fixes:
- `types/index.ts` — `logoUrl` is now "explicitly uploaded logo only";
  added `backgroundImagePath?: string` for the artwork.
- `services/api.ts` mapper — `logoUrl: bStr(config.logoUrl || raw.filePath) || undefined`,
  `backgroundImagePath: bStr(raw.backgroundImagePath) || undefined`.
- `NON_LOGO_URLS` set (`/ahmadiyyah_logo.png`, `/certificate-design1.png`,
  `/certificate-design2.png`) — `normalizeTemplateSignature` treats these as
  "no logo set" so stale backend/localStorage values self-heal.
- `forEach` → `map` in `getAll`.
- `save` no longer persists a non-logo as `logoUrl`.
- `templatesApi.preview` now sends `template.backgroundImagePath || template.logoUrl`.

Emblem resolution is now: explicit logo → `AUXILIARY_LOGO_SRC[logoType]` →
`AUXILIARY_LOGO_SRC[auxiliary]` → `/ahmadiyyah_logo.png`.
Atfal and Nasra have no dedicated asset, so they correctly use the Ahmadiyya mark.

**Still open:** if a template's stored `configurationJson` contains a saved
purple palette (e.g. the "Midnight Purple" preset was clicked and saved), the
colours still render purple. That is stored data, not a code bug — offer a
one-time correction if the user wants it.

## Certificate-type dropdown (this session)
The horizontal `Tabs` strip (All Certificates / Participation / Merit /
Excellence / Appreciation / Recognition / Attendance) overflowed and cut off the
later types.

- New `components/ui/FilterDropdown.tsx` — client dropdown with count badges,
  check mark on the active option, outside-click + Escape to close,
  `role="listbox"` / `aria-selected` / `aria-expanded`.
- `app/(dashboard)/certificates/page.tsx` — `Tabs` replaced with
  `FilterDropdown` inside the existing filter bar (search | type dropdown |
  event select). `typeTabs` keys renamed `id` → `value` to match the
  dropdown's option shape. `Tabs` import removed from this page.
- The events page also uses `FilterDropdown` (converted for consistency).
  `components/ui/Tabs.tsx` is now **unused** — kept in place as a reusable
  primitive, but nothing imports it.

## Toast coverage gaps fixed (this session)
User reported: adding a participant and removing one produced no toast.
Root causes: (a) remove had **no toast at all** — only the ConfirmDialog card;
(b) single add only toasted when `verificationStatus === 'Verified'`, so any
other status was completely silent; (c) bulk import had only an error toast,
never a success one; (d) the **admins page had zero toasts**.

Added:
- `participants/page.tsx` — single add now always notifies (success when
  verified, `info` naming the actual status otherwise); bulk import reports
  verified count + skipped breakdown; remove shows a success toast.
- `admins/page.tsx` — added `useToast` (page had none): assign/update, delete
  and revoke all notify.
- `events/page.tsx` — delete toast.
- `certificates/page.tsx` — delete toast.
- `templates/page.tsx` — delete toast.

Pattern going forward: the ConfirmDialog success **card** stays (it explains
the outcome), and a toast is added for immediate feedback. Errors still
propagate to the dialog's error stage — never both at once.

## 204 / null-body proxy crash (this session — IMPORTANT)
Symptom: `TypeError: Response constructor: Invalid response status code 204 (cause: UNKNOWN)`
surfaced in the ConfirmDialog error card after a **successful** delete.

Root cause: the backend answers DELETE with **204 No Content**. The Next.js
proxy did `new Response(upstream.arrayBuffer(), { status: 204 })` — the Fetch
spec forbids a body on null-body statuses (101/204/205/304), so the Response
constructor threw. The proxy's catch turned that into a 502, making a
successful delete look like a failure.
Verified with node: `new Response(new ArrayBuffer(0), {status:204})` throws;
`new Response(null, {status:204})` is fine. An empty **string** body also throws.

Fix: both proxy routes now pass `null` for the body and omit `content-type`
on null-body statuses.
- `app/api/backend/[...path]/route.ts` — `NULL_BODY_STATUSES` set.
- `app/api/auth/login/route.ts` — same (latent; `upstream.text()` returns '' for 204, which is still a non-null body).

These are the only two route handlers in the app — both fixed.

## Delete-flow consistency (this session)
Root cause of "Removed Successfully!" + "Something went wrong" at the same time:
the page handler caught the error, showed a toast, then **resolved normally** — so
ConfirmDialog advanced to the success stage anyway. Two fixes:
1. **No error swallowing in `onConfirm` handlers** — all six now let the error
   propagate to ConfirmDialog's error stage: `confirmDeleteParticipant`,
   `confirmDeleteCertificate`, `confirmDeleteEvent`, `confirmDelete` (admins),
   `confirmRevoke` (admins, already clean), `confirmDeleteTemplate` (already clean).
2. **No detail pre-fetch before a DELETE** — `participantsApi.delete` and
   `certificatesApi.delete` used to `getById()` first purely to describe the
   record in the audit entry; a 404 on that lookup aborted the delete before it
   was ever attempted (this is what produced "Participant with id … not found").
   Both now accept the known record from the caller, skip the pre-fetch, and
   treat a 404 from the DELETE as "already gone" → success.
3. `deleteGeneralAdmin` now writes a 'General Admin Revoked' audit entry
   (was completely unlogged) and tolerates an already-deleted record.

Signatures changed:
- `participantsApi.delete(id, performedBy, participant?)`
- `certificatesApi.delete(id, performedBy?, certificate?)`
- `authApi.deleteGeneralAdmin(assignmentId, performedBy?)`
- `templatesApi.delete(id, performedBy?, templateName?)`

## Landing page (this session)
- `components/ui/CountUp.tsx` (new, client): IntersectionObserver-driven count-up with easeOutExpo, respects `prefers-reduced-motion`.
- `app/page.tsx`: hero stats converted from plain text to a reference-style panel — `rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm`, gold gradient top accent line, `divide-x divide-white/10` column dividers, amber-400 animated numbers, bold uppercase white labels, muted descriptions.
- Values kept as the user asked: **5** Auxiliaries / **A4** Print-ready / **100%** Audited. `HERO_STATS` array drives the block.
- Reference site: https://fanciful-fox-0fc648.netlify.app/ (Ruzworth Technologies) — 4-col stat bar, gold numbers, animated count-up.

## Git / worktree
- Branch: `ayo-frontend`; latest observed HEAD: `06a5aba`
- Never commit or push unless explicitly asked. No push/commit done by assistant.
- Worktree changes externally/auto-committed concurrently; re-read files before editing.
- `.env.local` ignored by `.gitignore`, never read/edited by assistant. No keys/tokens/secrets touched.

## Fixed this session (frontend-side spec bugs)
- **Bulk import isolation** (`services/api.ts` bulkUpload): each row now wrapped in try/catch in BOTH signed-in and offline paths. One failed lookup/create no longer aborts the batch. Failures counted in `failedCount` + collected in `failures[]` and written into the audit details. Summary audit is now ALWAYS written (previously only when `newlyAdded.length > 0`).
- **`addSingle` audit** (`services/api.ts`): signed-in path now writes the 'Member Verification' log before returning (previously only the offline path logged it).
- **`templatesApi.delete` audit** (`services/api.ts`): new signature `delete(id, performedBy?, templateName?)`; writes 'Template Deleted'. New AuditLog action `'Template Deleted'`. Caller updated in `app/(dashboard)/templates/page.tsx`.
- **`generateBulk` partial failure** (`services/api.ts`): the catch block now writes a 'Certificate Generated (partial)' audit entry listing how many were issued and why it failed, before rethrowing.
- **`templatesApi.save` honesty** (`services/api.ts`): backend rejection no longer swallowed. Local copy is kept, but a 'Template Save Failed' audit entry is written and a clear error is thrown ("The server rejected this template save: … it cannot be used to generate certificates until the server save succeeds"). New AuditLog action `'Template Save Failed'`.
- **Auxiliary-aware template defaults** (`services/api.ts`): new `AUXILIARY_TEMPLATE_DEFAULTS` table (Atfal / Khuddam / Lajna / Ansarullah / Nasra / All) supplying org name, subtitle, logoType, event title, badge, participation line, theme, duration, body text, signature date and colours. `mapBackendTemplateToTemplate` now resolves fallbacks from the template's OWN auxiliary — no more Atfal bleed onto a Khuddam design.
- **No invented values**: `Event.auxiliary`, `Participant.auxiliary`, `Certificate.auxiliary` are now `Auxiliary | undefined` (`types/index.ts`); mappers no longer default to `'Atfal'`. `'National HQ'` removed from the member mapping. `JamaatMember.mulkOrDistrict` is now optional. Event form rejects saving without an auxiliary.
- **Mock verification labelled** (`services/api.ts` + `services/jamaatMemberApi.ts`): local-registry verification results are now suffixed "(verified against the local registry — the central Jama'at member API is not connected)" so demo data is never mistaken for a central-API verification.
- Audit page filter list updated with the two new action types.

## Still outstanding (backend-side — cannot fix from here)
- `deleteGeneralAdmin` hard-deletes `AdminAssignments/{id}` → needs backend soft-delete/revoke to keep history (frontend audit call still to be added).
- Frontend login audit — backend should own this.
- PNG/JPG output — needs a backend image render endpoint.
- Mulk/District org level on `Participant` — needs a backend entity/DTO field (frontend type ready to accept it).

## Verification
- `npx eslint . --quiet` → clean
- `npx tsc --noEmit` → clean
- `npx next build` → success (15 routes)

## Key files
- `services/api.ts` — bulkUpload, addSingle, templatesApi.save/delete, generateBulk, mapBackendTemplateToTemplate, AUXILIARY_TEMPLATE_DEFAULTS, normalizeTemplateSignature
- `services/jamaatMemberApi.ts` — optional auxiliary, live/mock switch
- `types/index.ts` — optional `auxiliary` on Event/Participant/Certificate, optional `mulkOrDistrict`, new AuditLog actions
- `app/(dashboard)/events/page.tsx` — auxiliary '' handling + submit validation + auto-refresh reverted
- `app/(dashboard)/templates/page.tsx` — delete audit call
- `app/(dashboard)/audit/page.tsx` — new filter entries

## Constraints
- Never read/edit `.env.local`, keys, passwords, tokens, backend-private files.
- Do not commit/push unless explicitly asked.
- TanStack Query fully reverted/uninstalled; do not reintroduce.
- Saved Templates page flow intentionally reverted; do not recreate.
- Auto-refresh was implemented then explicitly reverted by the user — do not re-add.
- Member layout has no custom navbar; member page header is the glassmorphism source.
