# better-uoa-cal

A service which creates an iCal feed for your University of Auckland timetable.

## Development

Install the dependencies for both the client and server:

```bash
pnpm install
```

Copy the `client/example.env` file to `client/.env` and fill in the required values.

## Deployment

### GitHub Actions

A GitHub Actions workflow is set up to deploy the client and server to Firebase Hosting and Cloud Functions on push to the production branch. For this to work, you need to set up the following secret in your repository:

- `GOOGLE_CREDENTIALS`: the contents of a service account key JSON file with the roles required to deploy to Firebase Hosting and Cloud Functions for Firebase.

You must also set up the following environment variables in your repository:

- `TRPC_ENDPOINT`: the URL of the TRPC function
- `CALENDAR_ENDPOINT`: the URL of the calendar function

### Deploying to Firebase Hosting

```bash
cd client
pnpm run build
firebase deploy --only hosting
```

### Deploying to Firebase Cloud Functions

```bash
cd server
pnpm run build
firebase deploy --only functions
```
