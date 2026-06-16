GreenGaps
Overview

GreenGaps is a web-based geospatial decision-support system developed as a final-year BSc Computing dissertation project at Southampton Solent University.

The platform enables cyclists and community members to report urban cycling infrastructure issues through an interactive map interface. Reports are stored within a database, visualised using geospatial techniques such as marker clustering and heatmaps, and can be analysed by administrators through a dedicated dashboard.

The project investigates the following research question:

How can a web-based geospatial decision-support system support the identification of gaps in urban cycling infrastructure using user-generated spatial data?

Live Application

Frontend:

https://greengaps.vercel.app

Note: The backend is hosted on Render's free tier. After periods of inactivity, the first request may take up to 50 seconds while the service wakes up.

Demo Credentials
Administrator Account

Email:
admin@gmail.com

Password:
00000000

User Account

Email:
sarah.greengaps1@gmail.com

Password:
11111111

Key Features
Geospatial Reporting
Interactive map built with Leaflet and OpenStreetMap
Click-to-report infrastructure issues
Reverse geocoding via Nominatim API
Street and satellite map views
Spatial Analysis
Marker clustering
Heatmap visualisation
Geographic report distribution analysis
Report Management
Create, edit and delete reports
Image upload functionality
Infrastructure categorisation
Priority and status tracking
Community Features
Discussion forum
Replies and reactions
Report upvoting
Community engagement tools
Notifications
In-app notifications
Email notifications via SendGrid
Status update alerts
Administrative announcements
Administration
Analytics dashboard
User management
Report moderation
Broadcast messaging
Security
JWT authentication
Bcrypt password hashing
Role-based access control
Input validation and sanitisation
Technology Stack
Frontend
React 18
React Router
Axios
React Leaflet
CSS
Backend
Node.js
Express.js
JWT
Bcrypt
Multer
SendGrid
Database
PostgreSQL (Production)
SQLite (Local Development)
Deployment
Vercel (Frontend)
Render (Backend)
PostgreSQL on Render
External Services
OpenStreetMap
Nominatim API
SendGrid
System Architecture

React Frontend (Vercel)

↓

REST API

↓

Node.js / Express Backend (Render)

↓

PostgreSQL Database (Render)

Installation
Clone Repository
git clone https://github.com/YOUR_USERNAME/GreenGaps.git
cd GreenGaps
Install Frontend Dependencies
cd frontend
npm install
Install Backend Dependencies
cd backend
npm install
Configure Environment Variables

Create a .env file inside the backend directory:

DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_email_address
Run Backend
npm start
Run Frontend
npm start
Evaluation Results

The platform was evaluated through:

Functional Testing
Performance Testing
Usability Testing
Eye-Tracking Analysis (GazeRecorder)
Results
Evaluation Area	Result
Functional Testing	18/18 Test Cases Passed
General Usability	4.73 / 5
Feature Evaluation	4.75 / 5
Participants	20
Performance Benchmarks	Achieved
Future Development

Potential future enhancements include:

PostGIS integration
Persistent cloud-based image storage
Cycle route planning
Mobile application development
Real-time traffic integration
Council infrastructure system integration
Author

Natalia Georgiana Raducanu

BSc Computing

Southampton Solent University

2026

Dissertation

GreenGaps was developed as part of a final-year dissertation exploring the application of geospatial decision-support systems, participatory GIS, and user-generated spatial data within urban cycling infrastructure planning.

Licence

This repository is provided for academic and educational purposes.
