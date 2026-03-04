# iOS Architecture (React Native / Expo)

## Objective

Ship an iOS app after web MVP stabilizes, while reusing backend APIs, auth, and shared domain types.

## Recommended stack

- **Mobile framework**: Expo + React Native + TypeScript
- **State/data**: React Query for API data fetching/caching
- **Navigation**: Expo Router or React Navigation
- **Auth**: Campus SSO through hosted web flow (Auth.js/NextAuth on web backend)
- **Maps**: Apple Maps deep links and optional native map preview

## Shared contracts

Create a shared package at `packages/shared-types` to keep API payloads consistent between web and iOS:

- `ResourceCardDTO`
- `ResourceDetailDTO`
- `RecommendationDTO`
- `UserProfileDTO`
- `SummaryAnswerDTO`

The backend should return these DTO shapes so mobile can render without custom transformation logic.

## API usage

iOS app consumes existing endpoints:

- `GET /api/resources`
- `GET /api/resources/:id`
- `GET /api/recommendations`
- `GET/PUT /api/profile`

Later provider/admin mobile flows can consume the same admin endpoints once role checks are hardened.

## Suggested folder structure

```text
apps/mobile/
  app/
    (tabs)/
      index.tsx
      recommendations.tsx
      profile.tsx
    resource/[id].tsx
  src/
    api/
    components/
    hooks/
    types/
```

## Launch scope

### v1 mobile scope

- Search screen with filters
- Resource cards with key points
- Resource detail with key Q&A and directions
- Optional profile editing for recommendations

### later scope

- Saved resources
- Push reminders for deadlines/verification changes
- Provider-specific edits (role-gated)
