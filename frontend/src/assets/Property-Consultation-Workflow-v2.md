# Property Consultation & Meeting System — Developer Specification (v2)

## 0. What Changed from the Original Draft
The original workflow describes the "happy path" well, but a developer needs the
**unhappy paths** too — what happens when an executive doesn't respond, when a
customer misses a meeting, when two requests collide, etc. This version adds:

- A formal **Lead Status state machine** (so the DB/backend has a single source of truth)
- **Reassignment / escalation logic** when an executive rejects or doesn't respond
- **No-show, cancellation, and reschedule** flows for both customer and executive
- A minimal **data model** (entities + key fields) so the dev can start schema design
- A **notification architecture** recommendation (single service, not scattered emails)
- **Auto-assignment criteria** suggestions
- Timezone handling note
- API endpoint sketch

---

## 1. Core Entities (Data Model Sketch)

**Customer**
- id, name, mobile, email, created_at

**Property**
- id, title, location, price, assigned_expert_id (default expert), images, etc.

**Executive (Property Expert)**
- id, name, designation, mobile, email, whatsapp_number, working_hours,
  specialization/zone, active_status (online/offline/on-leave), workload_count

**Lead / Consultation Request**
- id, customer_id, property_id, preferred_date, preferred_time, message
- status (see state machine below)
- assigned_executive_id
- assignment_type (manual/auto)
- created_at, updated_at

**Meeting**
- id, lead_id, zoom_meeting_id, zoom_password, zoom_link
- scheduled_start, scheduled_end, actual_start, actual_end
- meeting_status (scheduled / completed / missed_customer / missed_executive / cancelled)

**Lead Update / Disposition** (post-meeting)
- id, lead_id, executive_id, disposition (Interested / Follow Up / Site Visit /
  Negotiation / Booking Done / Not Interested), notes, created_at

**Notification Log**
- id, recipient_type (customer/executive/admin), channel (push/email/sms/whatsapp),
  template_id, lead_id, sent_at, status

---

## 2. Lead Status — State Machine

This is the backbone of the system. Every screen (customer dashboard, admin
dashboard, executive dashboard) just reads off this status.

```
NEW_REQUEST
   ↓ (admin assigns)
ASSIGNED_PENDING_ACCEPTANCE
   ↓ accept            ↓ reject            ↓ reschedule-by-exec
SCHEDULED         → back to ASSIGNED       → PENDING_CUSTOMER_CONFIRMATION
                     (auto-reassign to        (customer accepts new time → SCHEDULED)
                      next executive)          (customer rejects → back to admin)

SCHEDULED
   ↓ (30 min before)
REMINDER_SENT
   ↓ meeting time reached
IN_PROGRESS
   ↓
COMPLETED  /  MISSED_BY_CUSTOMER  /  MISSED_BY_EXECUTIVE  /  CANCELLED

COMPLETED
   ↓ (executive disposition)
INTERESTED / FOLLOW_UP / SITE_VISIT_SCHEDULED / NEGOTIATION / BOOKING_DONE / NOT_INTERESTED
```

**Key rule:** Admin and Customer dashboards should never show raw internal
states like "ASSIGNED_PENDING_ACCEPTANCE" — map these to friendly labels
("Finding your expert…", "Confirmed", etc.) at the UI layer.

---

## 3. Phase 1 — Property Page (unchanged, kept for completeness)
- Book Free Consultation
- Contact Property Expert

---

## 4. Flow A — Book Free Consultation

### Step 1: Booking Form
Fields: Name, Mobile, Email, Preferred Date, Preferred Time Slot, Message (optional),
Property (auto-attached).

**Additions:**
- **Timezone**: capture customer's timezone (or detect via device) — important if
  the property portal serves multiple regions, so the Zoom invite shows correct
  local time to both parties.
- **Duplicate-request check**: if the same customer already has an open request
  for the same property, show "You already have a pending consultation" instead
  of creating a duplicate lead.
- **Slot availability check**: before allowing submit, check executive
  availability for that property/region for the chosen slot (optional but avoids
  immediate reschedules).

### Step 2: Lead Creation
System creates Lead with status = `NEW_REQUEST`.

### Step 3: Admin Notification
Admin receives push/email: Customer Name, Mobile, Property, Requested Date & Time,
plus a **"Suggested Executive"** (pre-computed by the system) to speed up manual
assignment.

### Step 4: Executive Assignment

**Manual:** Admin picks from a list, sorted by:
- Lowest current workload
- Matches property zone/specialization
- Online/available status

**Auto-assignment logic (recommended):**
1. Filter executives mapped to the property's zone/category
2. Exclude executives on leave or outside working hours for that slot
3. Pick the one with the lowest active-lead count (round robin as tiebreaker)
4. If no executive available within X minutes → escalate to admin with alert

Status → `ASSIGNED_PENDING_ACCEPTANCE`

### Step 5: Executive Response (with timeout)

Executive gets push + email with **Accept / Reschedule / Reject**.

**New: Response SLA**
- If executive doesn't respond within a configurable window (e.g., 15–30 min),
  system auto-escalates: notify admin AND auto-reassign to the next-best executive.
- ❌ **Reject** → status reverts to `NEW_REQUEST`-equivalent, system auto-assigns
  next executive (don't make admin redo manual work every time).
- 🔄 **Reschedule (by executive)** → executive proposes new date/time → status =
  `PENDING_CUSTOMER_CONFIRMATION` → customer gets notification to Accept or
  Decline the new slot. If declined, admin is notified to manually intervene.
- ✅ **Accept** → proceed to Zoom creation, status = `SCHEDULED`.

### Step 6: Zoom Meeting Creation
On Accept, system calls Zoom API to create meeting (ID, password, link), tied to
the Lead/Meeting record.

### Step 7: Notifications (Email + In-App)
As originally specified — Customer / Executive / Management all get relevant
details. **Recommendation:** route all of these through one Notification Service
(see Section 8) rather than separate email templates hardcoded per role.

---

## 5. Flow B — Direct Contact (Property Expert)
Unchanged from original — show Executive Name, Designation, Mobile, WhatsApp,
Email. Customer can Call / WhatsApp / Email directly.

**Addition:** Log this as a lightweight lead too (status = `DIRECT_CONTACT`) so
it shows up in the executive's performance stats and admin dashboard, even though
no meeting is scheduled.

---

## 6. Meeting Day

### Step 8: Reminders (30 min before)
- Customer: push + email + SMS
- Executive: push + email

**Addition — second reminder:** consider a 5-minute reminder too (push only),
since 30-min reminders are often forgotten.

### Step 9: Join Meeting
- Customer clicks Join → opens Zoom link (web or app)
- Executive joins from dashboard
- System marks status = `IN_PROGRESS` when either party joins (via Zoom webhook,
  if available) — this gives real, automatic "meeting started" tracking instead
  of relying on manual updates.

### Step 10: No-show Handling (new)
If meeting time passes + grace period (e.g., 10 min) with no Zoom join detected:
- Mark `MISSED_BY_CUSTOMER` or `MISSED_BY_EXECUTIVE` based on Zoom join logs
- Auto-notify admin
- Offer customer a **"Reschedule"** button directly from their dashboard for
  missed meetings — reduces drop-off

---

## 7. Post-Meeting

### Step 11: Executive Disposition
Executive selects: Interested / Follow Up Required / Site Visit Scheduled /
Negotiation / Booking Done / Not Interested + notes.

**Addition:** If "Follow Up Required" or "Site Visit Scheduled" is selected,
prompt the executive to set a **follow-up date** right there — this becomes a
task/reminder for the executive automatically, closing the loop without needing
a separate CRM step.

### Step 12: Dashboards
**Customer — "My Consultations":** Property, Executive + contact, Date/Time,
Status, Zoom Link, History.

**Admin — "Consultation Management":** Total / Assigned / Upcoming / Completed /
Missed — **add a filter by executive, property, and date range**, plus an
**escalation queue** showing leads stuck in `ASSIGNED_PENDING_ACCEPTANCE` past SLA.

**Executive Performance:** Leads Assigned, Meetings Conducted, Site Visits
Scheduled, Bookings Closed, Conversion Rate — **add average response time**
(how fast they accept/reject) as a quality metric for admins.

---

## 8. Notification Architecture (recommendation)

Instead of building email/push/SMS logic separately into each step, build a
single **Notification Service** that:

1. Takes (event_type, lead_id, recipient_role) as input
2. Looks up the right template per channel (email/push/SMS/WhatsApp)
3. Logs every send to `Notification Log` (for debugging "customer says they
   didn't get the email")
4. Can be triggered by: lead status changes, scheduled jobs (reminders), and
   Zoom webhooks

This keeps the workflow logic (state machine) separate from delivery logic,
which makes it much easier to add new channels (e.g., WhatsApp confirmations)
later without touching core booking code.

---

## 9. Suggested Tech Building Blocks
- **Zoom API**: Meetings API (server-to-server OAuth) for create/update/cancel
  + Webhooks for join/leave/start/end events (powers auto status updates)
- **Notifications**: FCM/OneSignal for push, SES/SendGrid for email, Twilio/
  similar for SMS + WhatsApp Business API
- **Scheduler**: cron/queue worker for reminder jobs and SLA-timeout checks
- **Calendar sync (optional but valuable)**: push accepted meetings to
  executive's Google/Outlook calendar so it doesn't live only inside the app

---

## 10. Minimal API Sketch
```
POST /leads                      → create consultation request
GET  /leads/:id                  → lead details + current status
POST /leads/:id/assign           → admin assigns/reassigns executive
POST /leads/:id/respond          → executive accept/reject/reschedule
POST /leads/:id/meeting          → create zoom meeting (internal, triggered on accept)
POST /leads/:id/disposition       → executive post-meeting update
GET  /dashboard/customer/:id     → customer's consultations
GET  /dashboard/admin            → admin overview + filters
GET  /dashboard/executive/:id    → performance metrics
POST /webhooks/zoom              → meeting start/end/no-show events
```

---

## 11. Flow C — Live Chat + Instant Connect (new, sits alongside Flow A & B)

This adds a third, lighter-weight CTA for customers who want quick answers
without scheduling anything formal.

### Property Page now shows 3 CTAs:
- 📅 Book Free Consultation (Flow A — scheduled Zoom)
- 💬 Chat with Property Expert (new — instant live chat)
- 📞 Contact Property Expert (Flow B — direct call/WhatsApp/email)

### Step 1: Customer Opens Live Chat
- Chat widget opens with property context auto-attached (price, location,
  size, etc.) so whoever answers sees the same property the customer is on.
- System checks for an **online executive** mapped to this property/zone.
  - If found → chat is routed directly to them.
  - If none online → routed to a general support pool, or shown an
    "offline" state (see Step 4).

### Step 2: Live Conversation
Agent/executive answers questions about the property in real time —
pricing, amenities, availability, nearby facilities, etc. This is the
"explain everything about the property" layer the original flow was
missing.

### Step 3: In-Chat Escalation Actions
At any point, either the agent or the customer can trigger one of:

- **"Schedule a video consultation"** → opens the Flow A booking form,
  pre-filled with property + (if known) customer details. Creates a Lead
  as in Section 4, status = `NEW_REQUEST`.
- **"Call me now"** → creates a lightweight lead with status =
  `INSTANT_CALL_REQUESTED`. Notifies the currently-online executive (or
  the next available one) to call the customer within a short SLA (e.g.,
  5–10 minutes). No Zoom, no scheduling — just a callback.
- **"Continue on WhatsApp"** → opens WhatsApp Click-to-Chat with the
  assigned/available executive, pre-filled with a message containing the
  property link, so the conversation continues on a channel the customer
  already uses daily.

### Step 4: No Executive Online (fallback)
- Show a friendly offline message + a short "Leave your number and
  question" form.
- Creates lead with status = `OFFLINE_MESSAGE`.
- Next available executive (or admin, if SLA missed) gets notified to
  follow up — this becomes a normal lead in the admin dashboard, same as
  any other.

### New Lead Statuses (add to Section 2 state machine)
```
LIVE_CHAT_INITIATED → (escalates to) NEW_REQUEST | INSTANT_CALL_REQUESTED | OFFLINE_MESSAGE
INSTANT_CALL_REQUESTED → CALL_COMPLETED | CALL_MISSED
OFFLINE_MESSAGE → CONTACTED | NEW_REQUEST (if customer later books)
```

### Why this helps
- Customers who just want quick info aren't forced into a 30-minute
  scheduled video call.
- Every interaction — chat, instant call, WhatsApp, offline message —
  still becomes a tracked lead, so nothing falls through the cracks for
  admin/executive performance reporting.
- Live chat naturally **funnels** into Flow A (book a real consultation)
  or Flow B (direct contact) once the customer is ready, so you're not
  building three disconnected systems — just one entry point with three
  exits.

### Admin Dashboard additions
- Live Chat volume, average response time, chat-to-booking conversion %
- Instant Call requests vs. completed vs. missed
- Offline messages pending follow-up

---

## 12. Complete Journey (updated)
```
Property Page
  ↓
Book Free Consultation → Lead Created (NEW_REQUEST)
  ↓
Admin Notified → Executive Assigned (ASSIGNED_PENDING_ACCEPTANCE)
  ↓
Executive responds within SLA?
  ├─ No → auto-reassign + notify admin
  ├─ Reject → auto-reassign
  ├─ Reschedule → customer confirms new time → SCHEDULED
  └─ Accept → Zoom created → SCHEDULED
  ↓
Reminders (30 min, optional 5 min)
  ↓
Meeting Day → joins detected via Zoom webhook → IN_PROGRESS
  ↓
COMPLETED / MISSED → (if missed) customer can self-reschedule
  ↓
Executive Disposition (+ follow-up date if applicable)
  ↓
Site Visit / Negotiation / Booking Done / Sale Completed
```
