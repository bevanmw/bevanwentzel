# Paid Consultation Booking System Design

## Original Plan

### Summary

Add a site-wide "Book a consultation" entry point that links to a dedicated booking page, backed by a Cloudflare-hosted runtime and database. The system will read your Google Calendar availability, let visitors request a 45-minute paid consulting session, enforce configurable scheduling rules, protect submissions with Turnstile, create a pending hold in your calendar, and require your approval by email before the booking is actually confirmed.

Defaults chosen from planning:

- Keep Cloudflare as the hosting platform.
- Use a global CTA as the site-wide entry point.
- Use email approve/reject links for the admin workflow.
- Use Resend for outbound email.
- Use one Google Calendar account/calendar as the availability and booking source.
- Use your site/default timezone unless the visitor explicitly selects another timezone in the UI.

### Key Changes

#### Runtime and deployment

- Replace pure static export with a Cloudflare-backed runtime setup so the app can serve dynamic booking pages, API endpoints, Turnstile verification, Google Calendar access, and signed approval actions.
- Remove the current static-only deployment assumption from `next.config.ts` and adopt the Cloudflare-compatible Next deployment path for server routes/actions.
- Keep the existing marketing/blog pages intact; only the booking flow requires dynamic behavior.

#### Booking UX

- Add a persistent "Book a consultation" CTA in the main nav and footer on every page.
- Add a dedicated booking page with:
  - Clear "paid consultation" positioning at the top.
  - A short explanation that requests are reviewed first and are not automatically confirmed.
  - Session details surfaced from config: 45-minute duration, at least 1 hour between sessions, minimum 1 week notice.
  - Time slot picker derived from live Google Calendar availability.
  - Form fields for: name, email, timezone, brief description of the problem/topic, and selected slot.
  - Turnstile challenge before submission.
- After submit, show a "request received" state that explicitly says:
  - the slot is pending review,
  - a quote will be sent manually,
  - the consultation is paid,
  - the meeting is not confirmed yet.

#### Scheduling and calendar behavior

- Add an in-code booking config module for all scheduling/product rules:
  - session duration,
  - minimum gap between sessions,
  - minimum advance notice,
  - working hours / allowed weekdays,
  - destination calendar ID,
  - site timezone,
  - CTA text / price-label copy.
- Compute availability from Google Calendar by:
  - reading existing busy events from your configured calendar,
  - excluding any slot that violates notice/gap/working-hours rules,
  - excluding slots already held by pending bookings in the app database.
- On submission:
  - validate Turnstile,
  - re-check slot availability server-side,
  - create a pending booking record,
  - create a private "pending consultation request" event in Google Calendar to hold the slot and prevent double-booking.
- On approval:
  - update the existing pending calendar event into the confirmed consultation event,
  - update booking status to approved,
  - send approval email to the requester.
- On rejection:
  - cancel/delete the pending calendar hold,
  - update booking status to rejected,
  - send rejection email to the requester.

#### Data, auth, and integrations

- Add persistent storage for booking requests, approval state, and event linkage.
  - Default: Cloudflare D1.
- Add Google Calendar integration using OAuth credentials for your Google account with offline access/refresh token support.
- Add Resend integration for:
  - visitor pending-request email,
  - your admin notification email,
  - your admin email approve/reject links,
  - visitor approved/rejected emails.
- Add Turnstile integration with server-side token verification.
- Approval links should be signed, single-purpose, and time-limited. No full admin dashboard is required in v1.

### Public Interfaces / Contracts

#### New user-facing routes

- Booking page route, e.g. `/book`.
- Availability endpoint or server action returning bookable slots for a date range.
- Booking submission endpoint or server action.
- Approval/rejection action route(s) driven by signed email links.

#### Booking record shape

Persist at least:

- `id`
- `status = pending | approved | rejected | expired | cancelled`
- requester name
- requester email
- requester timezone
- problem description
- selected slot start/end
- config snapshot used for validation
- Google Calendar event ID
- approval token metadata / expiry
- created/updated timestamps

#### Config surface

Single in-code config object/module with:

- `sessionDurationMinutes`
- `minimumGapMinutes`
- `minimumNoticeHours` or `minimumNoticeDays`
- `allowedWeekdays`
- `workingHours`
- `calendarId`
- `defaultTimezone`
- `bookingLeadCopy` / paid-consultation copy
- optional future `priceDisplayText` even if quoting remains manual in v1

### Test Plan

#### Scheduling and validation

- Availability excludes slots within 1 week.
- Availability excludes slots that violate the 1-hour buffer.
- Availability excludes slots overlapping confirmed calendar events.
- Availability excludes slots already held by pending requests.
- Availability respects configured working days/hours and timezone conversion.

#### Submission flow

- Valid Turnstile + valid slot creates a pending booking and calendar hold.
- Invalid Turnstile is rejected.
- Double-book race is rejected by server-side revalidation.
- Missing/oversized problem description is rejected with clear validation errors.

#### Approval/rejection flow

- Approve link converts pending booking to approved and updates the existing Google Calendar event.
- Reject link cancels the pending calendar hold and marks the booking rejected.
- Expired/invalid signed links fail safely and do not mutate state.
- Approval/rejection email copy clearly states the session is paid and quote handling is manual.

#### UX/content

- CTA is visible from every page.
- Booking page clearly communicates "paid", "pending review", and "quote sent manually".
- Confirmation screen and emails do not imply automatic acceptance.

### Assumptions

- Single consultation type in v1; no multi-service catalog.
- One Google Calendar is the source of truth for both availability and booked sessions.
- Manual quoting remains outside the system in v1; the app only communicates that the consultation is paid and that a quote will follow.
- No Stripe/payment collection in v1.
- No full admin dashboard in v1; signed email approval links are sufficient.
- Cloudflare D1 is the default persistence choice unless there is an existing preferred managed DB.
- Resend is the default transactional email provider.

## Overview

This repo is currently a minimal Next App Router site with static export enabled in `next.config.ts`. The booking system requires a move to a Cloudflare Workers-backed Next deployment with checked-in runtime config, D1 schema and migrations in-repo, explicit bindings for D1, Queues, and environment variables, and first-class provider interfaces so local development can default to stubs.

The product is a single-service, site-wide paid consultation flow with a primary CTA in the nav and footer linking to `/book`. The booking page should be mostly server-rendered with a small client island, marked `noindex`, and present grouped slots by date in a week/range view. It should preload the earliest valid 14-day window after the notice cutoff, auto-advance until it finds availability within a 60-day horizon, and fall back to a no-availability state plus `hello@bevanwentzel.com` if none exists. Copy must explicitly say the session is paid, requests are reviewed by a human, submission does not guarantee acceptance, the slot is held temporarily, and quote/details follow manually after approval. Pricing is a structured config value with amount `2500` and currency `ZAR`, displayed as a starting price.

## Scheduling Rules

- Canonical scheduling timezone: `Africa/Johannesburg`
- Visitor timezone behavior: auto-detect on first load, allow manual override via IANA timezone select
- Working hours: `09:00-19:00`
- Allowed days: weekdays only
- Minimum notice: rolling `168 hours`
- Booking horizon: `60 days`
- Session duration: `45 minutes`
- Slot increment: `15 minutes`
- Buffer rule: `1 hour` after a consultation relative to any busy calendar event

Availability is computed live from Google Calendar on every request using one owner-controlled calendar authenticated by a single-user OAuth refresh token, plus pending app-held slots. Busy means Google events marked busy. All-day busy events block the whole day. Shared caching is disabled.

## Booking UX

The booking page is a single-purpose flow:

- Site-wide primary CTA in nav and footer
- Dedicated `/book` route
- Grouped slot list by date rather than a calendar-first picker
- Earliest valid 14-day range preloaded
- Auto-advance to the first available range within the 60-day horizon
- If no availability exists, show a clear empty state and direct users to `hello@bevanwentzel.com`

The page copy must make these points explicit:

- This is a `paid consultation`
- The session is a `45-minute session`
- Requests are reviewed by a human
- Submission does not guarantee acceptance
- The slot is held temporarily
- Quote and final details follow manually after approval

The page should also show the hold-expiry policy before submission.

## Form Contract

Required fields:

- Full name
- Email
- Timezone
- Problem description
- Selected slot
- Required consent checkbox

Validation rules:

- Name is a single full-name field
- Name validation is minimal, max length `120`
- Email validation uses standard syntax validation only
- Email normalization is trim + lowercase only
- Do not normalize plus-addressing
- Problem description is required, multiline allowed, max length `1000`
- Preserve basic formatting while trimming obvious surrounding noise
- Slot selection is mandatory
- Consent stores both the checked boolean and a consent text version

The booking form should return structured field-level errors and a distinct machine-readable code for `slot no longer available` so the UI can refresh nearby availability automatically. If Turnstile is stale or invalid at submit time, the UI should preserve the entered fields and selected slot while prompting the user to retry verification.

## Availability and Submission

Availability lookup is anonymous and protected by Cloudflare-native rate limiting rather than Turnstile. Turnstile is enforced on submission and refreshed or revalidated if stale.

Submission behavior:

1. Validate Turnstile.
2. Re-check slot availability server-side.
3. Enforce one active `pending` or future `approved` booking per normalized email.
4. Treat duplicate retries idempotently by `email + slot`.
5. Reject different-slot retries while a pending request already exists.
6. Create the pending booking record.
7. Create a private generic pending calendar hold.
8. Show the public confirmation screen immediately after booking and hold success.

If the booking row is created but calendar hold creation fails, move the record to explicit `failed` state and do not send emails.

## Booking Lifecycle

Statuses include at least:

- `pending`
- `approved`
- `rejected`
- `expired`
- `cancelled`
- `failed`

Pending requests place a temporary exclusive hold immediately. The hold expires after `48 hours`. On expiry:

- The slot is released automatically.
- Cleanup runs via both cron and lazy inline request-time cleanup.
- Lazy cleanup mutates state inline when it finds expired holds.

If admin approval happens after expiry:

- Re-check live availability.
- If the slot is still free, approval may proceed.
- If the slot is no longer free, mark the booking `rejected`.

If a user manually cancels through direct email contact in v1:

- Release the hold immediately.
- Allow immediate resubmission.

Immediate resubmission is also allowed after rejection.

## Admin Review Flow

Approval authority is one fixed admin email address. There is no admin dashboard in v1.

Admin flow:

- Admin notification email is sent only after booking row creation and calendar hold creation both succeed.
- Email contains a signed link to an intermediate review page, not a one-click mutation link.
- Review route uses a deterministic route plus token param.
- Token metadata is stored in D1 in hashed form.
- One token per booking.
- Token is single-use when an approve or reject action succeeds.
- Token expiry matches the `48-hour` hold expiry.
- Replays or race conditions should render a graceful already-processed state.

The review page should show:

- Current validity of the slot
- Full requester problem description
- Approval and rejection actions only
- Rejection reason category chooser

Approval is binary only. The page does not support editing event titles or notes.

Rejection reason categories:

- `availability`
- `not_a_fit`
- `scope_mismatch`

`availability` can be selected manually as well as used for automatic conflict-style outcomes.

## Calendar Behavior

Pending holds remain generic and private. Approved calendar events also remain generic and private. Operational context lives only in the booking database and emails.

Approval updates the existing calendar event in place rather than deleting and recreating it.

The requester is not added as a Google Calendar attendee in v1.

## Email Behavior

Email provider: Resend

Pending email:

- Includes the exact requested slot
- Shows both the requester timezone and the site timezone
- Includes the hold expiry deadline
- States that the request is pending human review

Approval email:

- States the request was approved
- Says quote/details follow manually
- Does not imply automatic final confirmation beyond the approval decision

Rejection email:

- Sends automatically
- Invites the requester to reply by email for follow-up

No automatic reminder or expiry emails are sent when a pending request sits untouched until expiry.

Email dispatch behavior:

- Public confirmation is not blocked on email success
- Email retries are handled asynchronously via Cloudflare Queues
- Approval and rejection emails also go through the queue
- If state mutation succeeds but enqueueing follow-up email fails, the admin action page shows success with warning

## Privacy, Retention, and Audit

The booking form must include a brief privacy notice and a required consent checkbox.

Audit behavior:

- Append-only lifecycle audit trail
- Separate immutable D1 events table

Retention policy:

- Retain records for `365 days`
- After that, anonymize and keep only status, timestamps, slot times, and coarse config snapshot

## Implementation Shape

Platform decisions:

- Deploy as Cloudflare Workers-backed Next, not static export
- Keep D1 schema and migrations in the repo
- Check in deployment config for bindings and environment contracts
- Use first-class provider interfaces for Google Calendar, Resend, Turnstile, and other integrations
- Default local development to stubbed or fake providers
- Favor unit and integration tests around provider interfaces over relying mainly on end-to-end happy-path tests

Route shape:

- `/book`
- Availability JSON route handler with explicit `start` and `end` range and a max span of `14 days`
- Booking submission route handler
- Admin review route and approve/reject action route handlers

The booking page should be mostly server-rendered with a small client island for timezone, slot fetching, Turnstile, and submission interaction.

## Design Warnings

These choices are valid but worth keeping visible because they carry tradeoffs:

- Marking stale or expired approval attempts as `rejected` instead of `expired` weakens state semantics.
- Applying the 1-hour post-session buffer against any busy calendar event will reduce availability more aggressively than many users expect.
- Keeping approved calendar events fully generic means the calendar alone will not contain enough prep context for the consultation.
