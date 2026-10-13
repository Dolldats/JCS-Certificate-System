# Jama'at Certify

Jama'at Certify is a certificate management system for Jama'at events and auxiliaries. It combines a Next.js web application with a .NET API for managing events, participants, certificate templates, issued certificates, administrator access, and audit history.

## What the project includes

### Web application

- Public landing, sign-in, and sign-up pages.
- Dashboard with summary information and navigation for the main workflows.
- Event management, including creating, editing, and deleting events.
- Participant management, including member ID verification and participant imports.
- Certificate generation and management, with bulk generation, certificate preview, printing, verification, and revocation workflows.
- Certificate Studio for choosing and editing certificate designs, colors, text, and signatories across the auxiliaries.
- Administrator assignment and access management for Super Admins.
- Audit Trail for reviewing recorded administrative activity.
- Responsive dashboard layout and a persistent light/dark theme option.

### API and data integration

- ASP.NET Core API in `JCS.API`, with application and infrastructure projects alongside it.
- API endpoints for authentication, dashboard summaries, events, participants, certificates, certificate templates, administrator assignments, and audit logs.
- Next.js API routes that handle sign-in and proxy requests to the .NET backend.
- Frontend API services that use the backend when configured and provide local/mock data or browser-local template overrides for supported fallback workflows.

## Run locally

Install the JavaScript dependencies and start the web application:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other available scripts:

```bash
npm run lint
npm run build
npm run start
```

The .NET API project is in `JCS.API`. Configure backend connection details and any required credentials in your local environment before running the integrated application. Keep `.env.local` and other secrets out of Git; `.env*` files are ignored by the repository.

## Project progress

### Completed
- **2026-10-12:** Let members generate their own missing certificate PDF on download, with ownership checks, revoked-certificate protection, progress feedback, and visible download errors.
- **2026-10-12:** Improved participant audit entries to show the member ID, name, event, verification status, and HTTP result; removed duplicate client-side enrollment logging and stopped audit-log writes from generating recursive audit entries.
- **2026-10-12:** Made the certificate generator template selector show a clear empty state when no active saved templates are available, link admins to the template studio, and reset stale selections when templates change.

- **2026-10-12:** Fixed the admin participant and certificate flows: map Jama'at verification status correctly, persist verified/pending member states, use the backend for pasted roster imports, preserve participant contact details when editing, block unsafe participant removal when certificates exist, prevent duplicate active certificates, and make revoke/delete actions reflect backend results.
- **2026-10-12:** Bundled the Geist fonts locally so production builds work without fetching fonts from Google at build time.
- **2026-10-12:** Connected the dashboard, event, participant, certificate, template, administrator, and audit screens to the corresponding Swagger endpoints, including paging, member lookup, template assets and preview, certificate verification and PDF actions, and participant/template maintenance.
- **2026-10-12:** Replaced the raw 401 login error with a clear credential-neutral message asking users to check their Chanda number and password.
- **2026-10-12:** Added concise reviewer comments around the member flow, chart calculations, legacy-data cleanup, and sticky navigation behavior.
- **2026-10-11:** Documented the current application, API, and development setup in this README.
- **2026-10-11:** Fixed audit log loading to consume the backend's paged response, map its audit field names, and fetch all available pages.
- **2026-10-11:** Added a Member Portal for valid member accounts, showing their event participation and certificate status; member accounts now route there instead of being rejected or treated as admins.
- **2026-10-11:** Replaced the Member Portal's separate event and certificate counters with an accessible donut chart showing issued certificates versus events still awaiting certificates.
- **2026-10-11:** Redesigned the four Super Admin KPI pie charts as larger animated progress rings with centered percentages and metric-specific colors for active events, verified participants, issued certificates, and Member API match rate.
- **2026-10-11:** Added a branded sign-in loading overlay using the project logo, with reduced-motion support.
- **2026-10-11:** Filtered the three retired demo event records from backend results and cleaned them from the browser event cache.
- **2026-10-11:** Removed the two retired demo certificates from results and cache; dashboard rings now show no data when their denominator is zero.
- **2026-10-11:** Filtered the three legacy seeded audit logs from backend results and cleared them from the browser audit cache.
- **2026-10-11:** Fixed the dashboard shell to keep the sidebar and top navigation in place while page content scrolls, and applied theme-aware glass surfaces to both.
- **2026-10-11:** Matched the landing navbar to the dashboard glass header and made the Member Portal navbar sticky with the same treatment.
- **2026-10-11:** Styled the sticky landing navbar as a white translucent bar above the green hero.
- **2026-10-11:** Animated dashboard and Member Portal charts from 0% to their loaded data values, with reduced-motion support.
- **2026-10-10:** Added and refined the certificate management frontend, including dashboard workflows, event and participant pages, certificate generation and editing, template studio, administrator access, and audit views.
- **2026-10-10:** Added frontend authentication and backend API proxy integration, with local fallback behavior for supported data workflows.
- **2026-10-10:** Added a persistent light/dark theme toggle for the landing, authentication, and dashboard experiences.
- **2026-10-11:** Merged the latest `master` changes into `ayo-frontend` and pushed the branch to `origin`.

### Future work tracking

After implementing each future feature, bug fix, design change, or integration in this project, add a dated entry under **Completed** describing the change. Keep this progress section current as the project evolves. Do not list work as completed until the change has actually been made.
