// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Firebase reads its config from REACT_APP_* env vars at module-load time and
// throws `auth/invalid-api-key` when they are absent (as they are in CI/test).
// Provide harmless dummy values so `src/firebase.ts` can initialize and any
// component that transitively imports it can be rendered in unit tests.
// These are never used to reach a real backend — network calls are not made
// in tests.
process.env.REACT_APP_FIREBASE_API_KEY ||= 'test-api-key';
process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||= 'test.firebaseapp.com';
process.env.REACT_APP_FIREBASE_PROJECT_ID ||= 'test-project';
process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||= 'test.appspot.com';
process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ||= 'test-sender';
process.env.REACT_APP_FIREBASE_APP_ID ||= 'test-app-id';
