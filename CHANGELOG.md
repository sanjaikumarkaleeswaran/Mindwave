## 📋 Changelog

### June 7, 2026 — Advanced Mobile Viewport Refinements
- 📱 **Navigation Bar De-crowding** — Adjusted the mobile bottom navigation to use `justify-around` and proper flex constraints, ensuring all 5 nav items distribute evenly without horizontal overflow or squished labels on narrow 320px screens.
- 🛡️ **Horizontal Overflow Elimination** — Addressed persistent horizontal scrolling issues by replacing hardcoded `100vw` widths with `max-w-full` and adding explicit `overflow-x-hidden` directly on the main application layout wrapper and individual page components (like the Chat page).
- 📐 **Padding Adjustments** — Refined the dynamic bottom padding `pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom,0px)+1rem)]` on the main layout to ensure consistent and correct spacing above the mobile navigation bar across all pages.

### June 6, 2026 — Mobile UI Responsiveness & Layout Fixes
- 📱 **Bottom Navigation Optimization** — Reduced the mobile bottom navigation bar from 8 items down to 5 essential modules (Home, Chat, Habits, Calendar, Journal) to prevent horizontal scrolling and squished icons on narrow screens.
- 🛡️ **CSS Layout Hardening** — Removed an overly aggressive `max-width: 100%` wildcard rule that was breaking absolute/flex positioning across mobile viewports, while preserving horizontal scroll protection on `#root`.
- 📐 **Padding Unification** — Fixed a major issue where page content received double bottom-padding (from both the `Layout` wrapper and individual pages). The `.mobile-page-pad` utility now only applies the necessary inner spacing.
- 📅 **Calendar Consistency** — Applied consistent bottom padding to the Calendar page to ensure it isn't hidden behind the mobile bottom navigation bar.

### May 3, 2026 — Modal UX Revert (Classic Style)
- 🔄 **GoalsPage Header** — restored the original inline header layout with title on the left and compact action buttons (Ask AI + New Goal) on the right. Removed the sticky full-width 2-column action bar grid.
- 🪟 **GoalFormModal** — removed the mobile-only bottom-sheet slide-up pattern; now uses a single unified centered scale-in modal on all screen sizes.
- 💬 **AIChatModal** — reverted from `items-end` bottom-sheet positioning to a centered `scale-in` animation on all screen sizes.
- 📋 **ActivityModal** — removed the dual mobile/desktop modal split (bottom-sheet + drag handle on mobile, centered on desktop) and replaced with one consistent centered modal for all devices.
- 🧹 **Filter Pills** — removed sticky positioning from the Goals page filter pills; they now scroll naturally with the page.

### April 23, 2026 — Full Mobile Responsiveness Overhaul
- 📱 **Compact Bottom Navigation** — reduced icon/label sizing and min-width so all 8 navigation items fit on the narrowest phones (360px+) without any horizontal overflow or scrolling.
- 🪟 **Universal Bottom-Sheet Modals** — converted `ActivityModal` and `DeleteModal` from plain centered overlays to the bottom-sheet slide-up pattern with a drag handle.
- 📐 **dvh Modal Heights** — replaced all `85vh` modal heights with `min(85dvh, 600px)` to correctly account for collapsible browser address bars on iOS and Android Chrome.
- 🎯 **CSS Variable Sticky Bars** — replaced hardcoded `top-24` sticky offsets on the Goals page with `calc(var(--header-h) + 0.75rem)`.
- 🛡️ **Fixed max-width CSS Rule** — removed the `max-width: 100vw` on every `*` selector and replaced it with a scoped rule targeting block-level elements and `#root` only.
- 🎨 **xs Breakpoint** — added a custom `xs: 360px` Tailwind breakpoint for targeted small-phone styles.
- 📊 **Dashboard Stat Grid Fix** — removed erroneous `col-span-2` on the Goals stat card causing uneven layouts.

### April 22, 2026 — Expense Tracker Mobile View Overhaul
- 📱 **Unified Glass-Card System** — replaced all custom Expense cards with the global `glass-card` utility for consistent radii and glassmorphism.
- 🪟 **Constrained Layout** — swapped the unconstrained wrapper for the standard `max-w-7xl` layout.
- 📊 **Responsive Bar Chart** — switched from `barSize={40}` to `maxBarSize={40}`, allowing spending bars to shrink gracefully on small screens.
- 🔘 **FAB-First Action Pattern** — the "Log Entry" header button is hidden on mobile; replaced by the floating FAB.

### April 20, 2026 — Unified Mobile Navigation
- 📱 **Scrollable Bottom Nav** — upgraded the mobile bottom navigation bar into a horizontally scrollable strip with instant access to all core modules.

### April 18, 2026 — Shared Goals & Collaboration
- 🤝 **Collaborative Goal Tracking** — Added the ability to share goals with colleagues and friends via email with real-time milestone tracking.

### April 16, 2026 — Layout Resiliency & Local Dev Polish
- 🛡️ **Scroll-Proof Modal Architecture** — refactored the Add Transaction modal to use strict flex-based centering on desktop.
- ⚙️ **Dynamic Port Binding** — updated backend CORS logic to intelligently whitelist wildcard local ports.

### April 15, 2026 — Premium Financial UI & Interaction Polish
- 💎 **Premium Button Systems** — upgraded all primary action buttons in the Financial OS with Indigo-vibe theme and glassmorphism shine animations.
- 📱 **Mobile FAB Optimization** — implemented a high-visibility, glow-enhanced Floating Action Button for financial logging on mobile.

### April 13, 2026 — Financial UI Refinement & Analytical Stability
- 📈 **Weekly Spending Trends** — overhauled bar chart logic to provide a consistent 5-week breakdown for any selected month.
- 🏷️ **Smart Categorization UI** — dynamic category filtering in the transaction modal based on Income vs. Expense type.
- 🔍 **Safe Analytical Search** — hardened the global expense filtering with null-safe note searching.

### April 12, 2026 — Financial OS & Bento Grid Redesign
- 💎 **Bento Grid Architecture** — completely redesigned the Expense Tracker module into a modular Bento Grid system.
- 🇮🇳 **INR Localization** — standardized entire financial suite to **Indian Rupee (₹)** with `en-IN` formatting.
- 📊 **Dynamic Analytics** — implemented donut-style category distribution charts and surgical bar charts for spending history.
- 🎯 **Budget Thresholds** — added category-specific budget limits with real-time progress indicators.
- 💾 **CSV Export** — added full data portability to the financial module.

### April 10, 2026 — Productivity Logic & Dashboard UX
- 📈 **Personalized Productivity Targets** — users can now set custom productivity targets (0–100%) via an interactive range slider on the dashboard.
- ⚡ **Dashboard Quick Actions** — added a horizontal action slider for one-tap navigation to core features.

