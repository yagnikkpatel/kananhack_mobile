# KananHack Mobile

Video Link: https://youtube.com/shorts/4BAm3c6sxN0

An AI-powered document verification mobile app built with React Native (Expo). Students can upload, verify, and manage their academic and identity documents. The backend uses Google Gemini AI to extract and analyze document data.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81.5 + Expo SDK 54 |
| Language | TypeScript |
| Routing | Expo Router v6 (file-based) |
| Auth Storage | Expo SecureStore |
| Icons | @expo/vector-icons (Ionicons) |
| Backend | Node.js REST API |
| AI | Google Gemini (server-side) |

---

## Project Structure

```
app/
├── (auth)/
│   ├── login.tsx           # Login screen
│   └── register.tsx        # Register screen
├── (tabs)/
│   ├── _layout.tsx         # Tab bar + profile header
│   ├── index.tsx           # Home / Dashboard
│   ├── upload.tsx          # File upload + file list
│   └── settings.tsx        # Settings (placeholder)
├── file/
│   ├── [id].tsx            # Document detail screen
│   └── sop-analysis/
│       └── [id].tsx        # Deep SOP analysis screen
├── _layout.tsx             # Root layout + auth guard
└── index.tsx               # Entry redirect

context/
└── AuthContext.tsx         # JWT auth state + SecureStore

utils/
└── api.ts                  # Fetch wrapper + token helpers

constants/
└── theme.ts                # Light/dark color tokens
```

---

## Features

### Authentication
- JWT-based login and registration
- Persistent session via Expo SecureStore
- Auto-redirect based on auth state (protected routes)

### Home Screen
- Personalized greeting with user's first name
- Application progress bar with live completion percentage
- Dashboard cards for each uploaded document showing:
  - Document type, verification status, authenticity score
  - AI-generated summary
- Tappable cards navigate to document detail screen
- **Submit Application** button appears when completion reaches 100%
- Pull-to-refresh

### Upload Screen
- File picker supporting PDF, JPEG, JPG, DOC, DOCX
- Client-side format validation before upload
- Multipart form upload with Bearer token auth
- Live file list with pull-to-refresh
- Each file card navigates to its detail screen
- Unsupported file types show a lock icon

### Document Detail Screen
Automatically detects document type and calls the correct endpoint:

| Document | Endpoint | UI |
|----------|----------|----|
| Marksheet | `POST /api/files/:id/marksheet-details` | SGPA/CGPA stats, subjects table with color-coded grades |
| Statement of Purpose | `POST /api/files/:id/sop-summary` | Word count, clarity score, topics, strengths |
| PAN Card | `POST /api/files/:id/pancard-summary` | PAN number, DOB, father's name, issuing authority |

### SOP Analysis Screen
Deep AI analysis via `POST /api/files/:id/sop-analysis`:
- Impact score out of 100 with color-coded progress bar
- Strengths, Weaknesses, Missing Elements breakdown
- Comparison against an ideal SOP (Structure, Tone, Clarity)
- 3 collapsible suggested rewrite formats with structure steps and sample outlines
- Overall improvement suggestions

### Profile & Settings
- Profile circle in top-right header on all tabs
- Dropdown showing user name, email, and logout

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/files` | List all uploaded files |
| POST | `/api/files/upload` | Upload a file (multipart) |
| GET | `/api/application/dashboard` | Home dashboard data |
| GET | `/api/application/progress` | Progress percentage |
| POST | `/api/application/submit` | Submit application |
| POST | `/api/files/:id/marksheet-details` | Marksheet AI analysis |
| POST | `/api/files/:id/sop-summary` | SOP summary |
| POST | `/api/files/:id/pancard-summary` | PAN card summary |
| POST | `/api/files/:id/sop-analysis` | Deep SOP analysis |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator / Expo Go

### Installation

```bash
npm install
```

### Running the app

```bash
# Start Expo dev server
npx expo start

# iOS
npx expo start --ios

# Android
npx expo start --android
```

### Environment
The app points to `http://localhost:3000` by default. Update the base URL in `utils/api.ts` and the fetch calls in screen files if your backend runs on a different host/port.

> On a physical device, replace `localhost` with your machine's local IP address (e.g. `192.168.x.x`).

---

## Supported File Formats

| Format | MIME Type | Supported Endpoints |
|--------|-----------|-------------------|
| PDF | `application/pdf` | marksheet-details, sop-summary |
| JPEG / JPG | `image/jpeg` | pancard-summary |
| DOC | `application/msword` | sop-summary |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | sop-summary |
