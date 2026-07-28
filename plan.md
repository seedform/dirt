Plan
===

```
Initialize a new Next.js project (App Router, TypeScript, Tailwind) in the current directory. 
Install Prisma and configure it with SQLite for local development (we will swap to Postgres later). 

Create a Prisma schema with these models:
- User: id (String, maps to Auth0 sub), email
- Survey: id (UUID), userId (relation to User), createdAt
- Submission: id (UUID), surveyId (relation to Survey), dietaryRestrictions (String array or JSON), createdAt. Make sure there is NO user-identifying info on the Submission model to guarantee anonymity.

Run the Prisma migration and generate the client. Then, set up shadcn/ui and install the Button, Card, and Input components.
```

```
Install @auth0/nextjs-auth0. 
Set up the dynamic route handler for Auth0 in `app/api/auth/[auth0]/route.ts`.

Update `app/layout.tsx` to wrap the app in the UserProvider.
Create a protected dashboard page at `app/dashboard/page.tsx` using `withPageAuthRequired`. 
Add a simple login/logout button to the main navigation. 

Don't write the dashboard UI yet—just ensure the route redirects unauthenticated users to the Auth0 login page and displays the user's email when they log in.
```

```
Update `app/dashboard/page.tsx`. When the team lead views this page:
1. Check if they have an active Survey in the database. If not, show a "Generate Survey Link" button that creates one.
2. Display their unique survey link: `[base_url]/s/[surveyId]`. Include a "Copy Link" button.
3. Query all Submissions tied to their Survey and display an aggregated dashboard (e.g., "Vegan: 2, Gluten-Free: 1, Peanut Allergy: 1").

Create the necessary Next.js Server Actions in a `lib/actions.ts` file to handle survey creation and fetching aggregated data.
```

```
Create a public page at `app/s/[surveyId]/page.tsx`. 
This page should verify the surveyId exists in the database. If not, show a 404.

Build a form allowing teammates to input their dietary restrictions (use checkboxes for common ones like Vegan, Vegetarian, Gluten-Free, Nut Allergy, plus an "Other" text field).

Create a Server Action to handle the form submission. It must save the restrictions to the `Submission` table using the `surveyId`, without requiring login or capturing any IP/user info. 
Show a "Thank you" success state after submission.
```

```
Install `@opentelemetry/api`, `@opentelemetry/sdk-node`, and `@opentelemetry/auto-instrumentations-node`.

Enable the `instrumentationHook` in `next.config.js`. 
Create `instrumentation.ts` in the root directory to initialize the OpenTelemetry NodeSDK. Output traces to the console for local verification.

Update the submission Server Action. Manually extract the W3C `traceparent` header if it exists in the incoming request, start a new custom span called "process_submission", and create a custom OTel metric counter that increments whenever a new restriction is submitted.
```

```
Install Vitest and React Testing Library. 
Configure Vitest for the Next.js environment.

Write two unit test suites:
1. Test the submission Server Action logic (mocking Prisma to ensure it successfully writes a valid submission and rejects invalid inputs).
2. Test the aggregation logic that transforms raw Submissions into the dashboard counts (e.g., ensuring 3 vegan submissions and 1 peanut allergy group correctly).
```