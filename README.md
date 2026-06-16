# GreenGaps
### A Web-Based Geospatial Decision-Support System for Urban Cycling Infrastructure

GreenGaps is a full-stack web application developed as a final-year BSc Computing dissertation project at Southampton Solent University.

The platform enables cyclists and community members to:
- Report cycling infrastructure issues directly on an interactive map
- Visualise problem hotspots using geospatial analysis tools
- Participate in community discussions
- Receive notifications regarding report updates

---

## Research Question

> How can a web-based geospatial decision-support system support the identification of gaps in urban cycling infrastructure using user-generated spatial data?

---

## Running the Application

There are two ways to access GreenGaps:

---

### Option 1 — Live Deployment (No Setup Required)

Visit the deployed application directly at: https://greengaps.vercel.app

> **Note:** The backend is hosted on Render's free tier. After periods of inactivity, the first request may take up to 50 seconds while the service wakes up.

---

### Option 2 — Run Locally

#### Prerequisites
- Node.js (v18 or above)
- npm

#### 1. Extract the project
Extract the ZIP file and open the folder in VS Code.

#### 2. Install dependencies

**Frontend:**
```bash
cd client
npm install
```

**Backend:**
```bash
cd server
npm install
```

#### 3. Set up environment variables
Create a `.env` file inside the `server/` folder with the following:

```env
JWT_SECRET=your_jwt_secret
SENDGRID_API_KEY=your_sendgrid_key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

#### 4. Start the backend
```bash
cd server
node index.js
```

#### 5. Start the frontend
```bash
cd client
npm start
```

The app will open at **http://localhost:3000**

---

## Demo Credentials

**Administrator Account**
- Email: `admin@gmail.com`
- Password: `00000000`

**User Account**
- Email: `sarah.greengaps1@gmail.com`
- Password: `11111111`

---

## Key Features

### 🗺️ Geospatial Reporting
- Interactive map built with Leaflet and OpenStreetMap
- Click-to-report infrastructure issues
- Reverse geocoding using the Nominatim API
- Street and satellite map views

### 📊 Spatial Analysis
- Marker clustering
- Heatmap visualisation
- Geographic distribution analysis
- Infrastructure hotspot identification

### 📋 Report Management
- Create, edit, and delete reports
- Upload images
- Status tracking and priority management

### 💬 Community Features
- Discussion forum with replies and reactions
- Report upvoting
- Community engagement tools

### 🔔 Notifications
- In-app notifications
- Email notifications via SendGrid
- Report status updates and administrative announcements

### 🛠️ Administration
- Analytics dashboard
- User management
- Report moderation
- Broadcast messaging

### 🔒 Security
- JWT authentication
- Bcrypt password hashing
- Role-based access control
- Input validation and sanitisation

---

## Technology Stack

### Frontend
- React 18
- React Router
- Axios
- React Leaflet
- CSS

### Backend
- Node.js
- Express.js
- JWT
- Bcrypt
- Multer
- SendGrid

### Database
- PostgreSQL (Production)
- SQLite (Local Development)

### Deployment
- Vercel (Frontend)
- Render (Backend)
- PostgreSQL on Render

### External Services
- OpenStreetMap
- Nominatim API
- SendGrid

---

## System Architecture
React Frontend (Vercel)
↓
REST APIs
↓
Node.js / Express Backend (Render)
↓
PostgreSQL Database (Render)

---

## Evaluation Results

| Metric | Result |
|---|---|
| Functional Testing | 18 / 18 Test Cases Passed |
| General Usability | 4.73 / 5 |
| Feature Evaluation | 4.75 / 5 |
| Participants | 20 |
| Performance Benchmarks | Achieved |

---

## Future Development

- PostGIS spatial extension integration
- Persistent cloud-based image storage
- Cycle route planning
- Mobile application development
- Real-time traffic integration
- Council infrastructure system integration

---

## Author

**Natalia Georgiana Raducanu**
BSc Computing — Southampton Solent University, 2026
Supervisor: Edita Gashi

---

## Licence

This repository is provided for academic and educational purposes.