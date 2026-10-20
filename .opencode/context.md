## Objective (current)
- Frontend-side spec bugs fixed ✅ DONE
- Delete flows now agree with the notification (dialog no longer contradicts the toast) ✅ DONE
- **Toast coverage: every action now notifies** ✅ DONE
- **204 proxy crash fixed** ✅ DONE
- **Refresh buttons on every admin page** ✅ DONE
- **Certificate-type tabs → dropdown** ✅ DONE
- **Template logo/watermark must match the auxiliary** ✅ DONE
- Landing page hero stats restyled to match reference site (Ruzworth) ✅ DONE

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
