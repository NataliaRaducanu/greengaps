import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import {
  MdDirectionsBike,
  MdPeople,
  MdSecurity,
  MdEco,
} from 'react-icons/md';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <Navbar />

      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero-icon">
          <MdDirectionsBike size={36} color="white" />
        </div>
        <h1>About GreenGaps</h1>
        <p>A community-driven platform helping cyclists identify and report infrastructure gaps across Birmingham, making our city safer and greener for everyone.</p>
      </section>

      {/* Mission */}
      <section className="about-section white">
        <div className="about-container">
          <h2>Our Mission</h2>
          <p className="about-lead">GreenGaps was created to bridge the gap between cyclists and city planners. We believe that the people who cycle Birmingham's streets every day are best placed to identify where infrastructure is missing, dangerous, or inadequate.</p>
          <div className="about-mission-grid">
            <div className="about-mission-card">
              <div className="about-mission-icon">
                <MdEco size={28} color="#2d7a4f" />
              </div>
              <h3>Greener City</h3>
              <p>Encouraging cycling reduces emissions and congestion, helping Birmingham meet its sustainability goals.</p>
            </div>
            <div className="about-mission-card">
              <div className="about-mission-icon">
                <MdSecurity size={28} color="#2d7a4f" />
              </div>
              <h3>Safer Streets</h3>
              <p>By highlighting dangerous gaps in infrastructure, we help prioritise improvements that protect cyclists.</p>
            </div>
            <div className="about-mission-card">
              <div className="about-mission-icon">
                <MdPeople size={28} color="#2d7a4f" />
              </div>
              <h3>Community Voice</h3>
              <p>Every report submitted gives cyclists a direct voice in shaping the future of Birmingham's transport network.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="about-section green-light">
        <div className="about-container">
          <h2>How GreenGaps Works</h2>
          <div className="about-steps">
            <div className="about-step">
              <div className="about-step-number">1</div>
              <div className="about-step-content">
                <h3>Cyclists Report Gaps</h3>
                <p>Registered users pin infrastructure issues directly on the interactive map — from missing cycle lanes to dangerous junctions and broken surfaces.</p>
              </div>
            </div>
            <div className="about-step">
              <div className="about-step-number">2</div>
              <div className="about-step-content">
                <h3>Reports Are Reviewed</h3>
                <p>Our admin team reviews each submission, categorises it by priority, and passes relevant reports to Birmingham City Council planners.</p>
              </div>
            </div>
            <div className="about-step">
              <div className="about-step-number">3</div>
              <div className="about-step-content">
                <h3>Progress Is Tracked</h3>
                <p>Users receive real-time notifications as their reports move from Open to In Progress to Resolved, closing the feedback loop.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="about-section white">
        <div className="about-container">
          <h2>GreenGaps in Numbers</h2>
          <div className="about-stats">
            <div className="about-stat">
              <span className="about-stat-number">1,247</span>
              <span className="about-stat-label">Reports Submitted</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">342</span>
              <span className="about-stat-label">Issues Resolved</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">856</span>
              <span className="about-stat-label">Active Users</span>
            </div>
            <div className="about-stat">
              <span className="about-stat-number">12</span>
              <span className="about-stat-label">Wards Covered</span>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure types */}
      <section className="about-section green-light">
        <div className="about-container">
          <h2>What Can Be Reported</h2>
          <div className="about-types-grid">
            {[
              { label: 'Missing Cycle Lanes', desc: 'Roads with no dedicated cycling provision' },
              { label: 'Dangerous Junctions', desc: 'Intersections that feel unsafe for cyclists' },
              { label: 'Poor Road Surface', desc: 'Potholes, damaged tarmac or debris' },
              { label: 'Lack of Signage', desc: 'Missing or confusing cycling route signs' },
              { label: 'No Bike Parking', desc: 'Areas with insufficient secure cycle storage' },
              { label: 'Blocked Cycle Paths', desc: 'Obstructions preventing safe passage' },
            ].map((type) => (
              <div className="about-type-card" key={type.label}>
                <div className="about-type-dot" />
                <div>
                  <strong>{type.label}</strong>
                  <p>{type.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-footer-grid">
          <div className="about-footer-brand">
            <div className="about-footer-logo">
              <MdDirectionsBike size={20} color="white" />
              <span>GreenGaps</span>
            </div>
            <p>Making cycling safer in Birmingham through community-driven infrastructure reporting.</p>
          </div>
          <div className="about-footer-col">
            <h4>Quick Links</h4>
            <Link to="/map">Map</Link>
            <Link to="/about">About</Link>
            <Link to="/help">Help & Tutorials</Link>
          </div>
          <div className="about-footer-col">
            <h4>Support</h4>
            <Link to="/contact">Contact Us</Link>
            <Link to="/help">FAQs</Link>
            <Link to="/contact">Report an Issue</Link>
          </div>
          <div className="about-footer-col">
            <h4>Legal</h4>
            <Link to="/privacy" state={{ tab: 'privacy' }}>Privacy Policy</Link>
            <Link to="/privacy" state={{ tab: 'terms' }}>Terms of Service</Link>
            <Link to="/privacy" state={{ tab: 'cookies' }}>Cookie Policy</Link>
          </div>
        </div>
        <div className="about-footer-bottom">
          <span>© 2026 GreenGaps. All rights reserved.</span>
          <span>Birmingham, UK</span>
        </div>
      </footer>
    </div>
  );
};

export default About;