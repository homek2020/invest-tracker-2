# Invest Tracker Requirements

## Overview

This document summarizes the core requirements for the Invest Tracker application.

## Application Goals

- Track balances of investment accounts with monthly snapshots.
- Support bulk editing of account balances for a selected month.
- Capture opening, inflow, outflow, and closing balances for each month, automatically computing the difference between opening and closing.
- Provide a "Close Month" action that moves the closing balance into the next month as its opening balance and prevents edits once closed unless reopened with audit logging.
- Automatically mirror the closing balance as the opening balance when a new month is created, with the difference field displayed in green when positive and red when negative.
- Deliver a dashboard for the server's current month with cumulative balances, performance charts for each account, and portfolio-wide returns.
- Display all values in USD using Central Bank of Russia (CBR) T+1 exchange rates with two decimal places.
- Offer modern UX with smooth transitions, loading states, centralized theming, and adaptive layouts for web (React) and mobile (React Native).

## Supported Providers

Codes and icons must be available for the following providers:

- `FINAM`
- `TRADEREPUBLIC`
- `BYBIT`
- `BCS`
- `IBKR`

## Roles and Authentication

- Single user role (account owner) authenticated via email + OTP or OAuth/OIDC.
- Sessions use JWT access and refresh tokens with secure cookies, logging each login attempt with timestamp, IP, user agent, and result.

## Key Use Cases

1. **Registration and Login**: Email OTP flow, profile creation with server time zone, and login logging.
2. **Account Management**: Create, update, delete accounts with provider, currency, active flag, and note. Currency changes require manual migration if balances exist.
3. **Monthly Balances**: Default to current server month, auto-calculate `difference` and `usdEquivalent`, enable form submission only after edits, color code differences, ensure closing equals opening for new months, support closing workflow with automatic next month creation.
4. **Bulk Balance Updates**: Submit month balances for all accounts in one request with calculated differences.
5. **Conversion and Charts**: Always show USD values using CBR rates; dashboard includes total balance card, per-account trend chart, and return charts per account and total.
6. **Navigation and Loading**: Spinners during tab switches, cached requests with invalidation after updates, lazy loading charts.

## Domain Rules

- Decimal128 monetary values rounded to two decimal places.
- Supported currencies: USD, EUR, RUB, GBP.
- Unique month constraint per account (`accountId`, `year`, `month`).
- Months can be closed only if previous month is closed or absent.
- Accounts with existing months cannot be deleted.

## Data Model (MongoDB)

Collections and key fields:

- `users`: email, creation time, last login, profile (base currency, locale), status.
- `login_logs`: login timestamp, IP, user agent, success flag, authentication method.
- `accounts`: user association, provider enum, currency, active flag, note, timestamps.
- `balances`: user and account references, year/month, status (`OPEN`/`CLOSED`), monetary fields, audit trail.
- `fx_rates`: date, base currency (`USD`), rate map, source (`CBR_T+1`), fetch timestamp.

## API Endpoints

Base path: `/api/v1`.

### Authentication

- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `POST /auth/refresh`

### Accounts

- `GET /accounts`
- `POST /accounts`
- `PATCH /accounts/:id`
- `DELETE /accounts/:id`

### Balances

- `GET /balances?accountId&year&month`
- `GET /balances/series?from=yyyy-mm&to=yyyy-mm`
- `POST /balances/bulk`
- `POST /balances/:id/close`
- `POST /balances/:id/reopen`

Responses include values in original currency and USD, with differences.

### FX Rates

- `GET /fx/usd-view?date=yyyy-mm-dd&amount=123&from=EUR`
- `GET /fx/rates?date=yyyy-mm-dd`
- `GET /fx/history?from=yyyy-mm-dd&to=yyyy-mm-dd`
- `POST /fx/update` (admin only)

UI includes an FX Rates tab for browsing and filtering by date ranges.

## CBR Integration

- CRON at 15:05 Europe/Moscow fetches T+1 rates, caching via Redis with fallback to the last known rate when missing.

## UI Requirements

- React + TypeScript, React Query, React Router, Zustand/Redux Toolkit, Formik, recharts.
- Main sections: Dashboard, Accounts, Balances, FX Rates.
- Use centralized theme variables (`theme.css`, `tailwind.config.js`).

## Architecture Layers

- Domain: business logic and validation.
- Data: MongoDB repositories and migrations.
- Services: external integrations (CBR, OTP, cache).
- Presentation: REST API and UI.

## Non-Functional Requirements

- API latency under 150 ms, charts render within 500 ms.
- Stateless API for scalability.
- Security via JWT, HTTPS, CORS, Helmet.
- Comprehensive logging and auditing.
- Localization in Russian and English.

## Return Calculations

- Monthly account return excludes inflows/outflows, with zero return when opening balance is zero.
- Cumulative account return is the product of monthly returns minus one.
- Portfolio return uses USD-adjusted values across accounts within a selected period.

## Deployment

Environment variables: `SERVER_TZ`, `JWT_SECRET`, `MONGO_URI`, `REDIS_URI`, `CBR_URL`, `CRON_CBR`, `CORS_ORIGINS`.

Docker Compose services: API, web, MongoDB, Redis, Nginx.

