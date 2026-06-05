import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MdDirectionsBike, MdMap, MdAddCircleOutline, MdBarChart, MdPeople } from 'react-icons/md';
import { getAllReports } from '../services/api';
import './Home.css';

const API = 'http://localhost:5000/api';

const Home = () => {
  const [reports, setReports] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [countedReports, setCountedReports] = useState(0);
  const [countedResolved, setCountedResolved] = useState(0);
  const [countedUsers, setCountedUsers] = useState(0);

  useEffect(() => {
    getAllReports()
      .then((res) => setReports(res.data))
      .catch((err) => console.error('Error loading home stats:', err));

    fetch(`${API}/users/stats`)
      .then(res => res.json())
      .then(data => setTotalUsers(data.total_users || 0))
      .catch(err => console.error('Error loading user stats:', err));
  }, []);

  const totalReports = reports.length;
  const resolvedReports = reports.filter(r =>
    r.status === 'resolved' || r.status === 'Resolved'
  ).length;
  const highPriorityReports = reports.filter(r => r.priority === 'High').length;

  // Animate count-up when numbers load
  useEffect(() => {
    if (totalReports === 0 && resolvedReports === 0 && totalUsers === 0) return;

    const duration = 1500;
    const steps = 40;
    const interval = duration / steps;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCountedReports(Math.round(totalReports * ease));
      setCountedResolved(Math.round(resolvedReports * ease));
      setCountedUsers(Math.round(totalUsers * ease));
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [totalReports, resolvedReports, totalUsers]);

  return (
    <div className="home">
      {/* Navbar */}
      <nav className="home-nav">
        <div className="home-nav-brand">
          <MdDirectionsBike size={28} color="white" />
          <div className="home-nav-title">
            <span className="home-nav-name">GreenGaps</span>
            <span className="home-nav-subtitle">Birmingham Cycling Infrastructure</span>
          </div>
        </div>
        <div className="home-nav-actions">
          <Link to="/login" className="home-btn-outline">Sign In</Link>
          <Link to="/register" className="home-btn-primary">Register</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-icon">
          <MdDirectionsBike size={36} color="white" />
        </div>
        <h1>Welcome to GreenGaps</h1>
        <p>Help improve cycling infrastructure in Birmingham by identifying and reporting infrastructure gaps. Join our community of cyclists making our city safer.</p>
        <div className="hero-buttons">
          <Link to="/register" className="hero-btn-primary">Get Started - It's Free</Link>
          <Link to="/map" className="hero-btn-outline">View the Map</Link>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <span className="stat-number">{countedReports}</span>
            <span className="stat-label">Reports Submitted</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{countedResolved}</span>
            <span className="stat-label">Issues Resolved</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{highPriorityReports}</span>
            <span className="stat-label">High Priority</span>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon">
              <MdPeople size={20} color="#2d7a4f" />
            </div>
            <span className="stat-number">{countedUsers}</span>
            <span className="stat-label">Cyclists in Birmingham</span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-icon">
              <MdMap size={32} color="#2d7a4f" />
            </div>
            <h3>Browse the Map</h3>
            <p>Explore existing infrastructure gap reports on our interactive map</p>
          </div>
          <div className="step">
            <div className="step-icon">
              <MdAddCircleOutline size={32} color="#2d7a4f" />
            </div>
            <h3>Report Gaps</h3>
            <p>Click anywhere on the map to report infrastructure needs you've identified</p>
          </div>
          <div className="step">
            <div className="step-icon">
              <MdBarChart size={32} color="#2d7a4f" />
            </div>
            <h3>Track Progress</h3>
            <p>Receive updates as city planners review and address your reports</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2>Ready to make a difference?</h2>
        <p>Join hundreds of cyclists improving Birmingham's cycling infrastructure</p>
        <Link to="/register" className="cta-btn">Create your free account</Link>
      </section>
    </div>
  );
};

export default Home;