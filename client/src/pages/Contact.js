import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import {
  MdEmail,
  MdLocationOn,
  MdPhone,
  MdDirectionsBike,
  MdSend,
  MdPerson,
  MdInfo,
  MdLanguage,
} from 'react-icons/md';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  return (
    <div className="contact-page">
      <Navbar />

      {/* Hero */}
      <section className="contact-hero">
        <div className="contact-hero-icon">
          <MdEmail size={28} color="#2d7a4f" />
        </div>
        <h1>Contact Us</h1>
        <p>Have questions or feedback? We'd love to hear from you. Get in touch with the GreenGaps team.</p>
      </section>

      {/* Main */}
      <section className="contact-main">
        <div className="contact-container">

          {/* Left — form + team */}
          <div className="contact-left">
            <div className="contact-form-card">
              {submitted ? (
                <div className="contact-success">
                  <div className="contact-success-icon">
                    <MdSend size={32} color="#2d7a4f" />
                  </div>
                  <h3>Message Sent!</h3>
                  <p>Thanks for reaching out. We'll get back to you within 2 working days.</p>
                  <button className="contact-reset-btn" onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2>Send us a message</h2>
                  {error && <div className="contact-error">{error}</div>}
                  <form onSubmit={handleSubmit}>
                    <div className="contact-form-group">
                      <label>Your Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Natalia Cyclist" autoComplete="off" />
                    </div>
                    <div className="contact-form-group">
                      <label>Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="natalia.cyclist@email.com" autoComplete="off" />
                    </div>
                    <div className="contact-form-group">
                      <label>Subject</label>
                      <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="What is this about?" autoComplete="off" />
                    </div>
                    <div className="contact-form-group">
                      <label>Message</label>
                      <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Tell us more..." rows={5} />
                    </div>
                    <button type="submit" className="contact-submit-btn">Send Message</button>
                  </form>
                </>
              )}
            </div>

            {/* Team */}
            <div className="contact-team-card">
              <h2>Our Team</h2>
              <div className="contact-team-grid">
                <div className="contact-team-member">
                  <div className="contact-team-avatar">
                    <MdPerson size={28} color="#2d7a4f" />
                  </div>
                  <strong>Sarah Wilson</strong>
                  <span>Project Lead</span>
                  <a href="mailto:sarah@greengaps.uk">sarah@greengaps.uk</a>
                </div>
                <div className="contact-team-member">
                  <div className="contact-team-avatar blue">
                    <MdPerson size={28} color="#3b82f6" />
                  </div>
                  <strong>Mike Johnson</strong>
                  <span>Technical Support</span>
                  <a href="mailto:mike@greengaps.uk">mike@greengaps.uk</a>
                </div>
                <div className="contact-team-member">
                  <div className="contact-team-avatar yellow">
                    <MdPerson size={28} color="#d97706" />
                  </div>
                  <strong>Emma Davis</strong>
                  <span>Community Manager</span>
                  <a href="mailto:emma@greengaps.uk">emma@greengaps.uk</a>
                </div>
              </div>
            </div>
          </div>

          {/* Right — info */}
          <div className="contact-right">
            <div className="contact-info-card">
              <h2>Get in Touch</h2>
              <div className="contact-info-item">
                <MdEmail size={18} color="#555" />
                <div>
                  <strong>Email</strong>
                  <p>support@greengaps.uk</p>
                </div>
              </div>
              <div className="contact-info-item">
                <MdPhone size={18} color="#555" />
                <div>
                  <strong>Phone</strong>
                  <p>+44 (0) 23 8059 5000</p>
                </div>
              </div>
              <div className="contact-info-item">
                <MdLocationOn size={18} color="#555" />
                <div>
                  <strong>Address</strong>
                  <p>Birmingham City Council Civic Centre<br />Birmingham SO14 7LY</p>
                </div>
              </div>
            </div>

            <div className="contact-channels-card">
              <h2>Contact Channels</h2>
              <div className="contact-channels">
                <div className="contact-channel">
                  <MdLanguage size={22} color="#d97706" />
                </div>
                <div className="contact-channel">
                  <MdEmail size={22} color="#d97706" />
                </div>
                <div className="contact-channel">
                  <MdInfo size={22} color="#d97706" />
                </div>
              </div>
              <div className="contact-response-box">
                <MdInfo size={16} color="#2d7a4f" />
                <p><strong>Quick Response:</strong> We typically respond to enquiries within 24-48 hours during business days.</p>
              </div>
            </div>

            <div className="contact-also-card">
              <p>You may also find answers in our:</p>
              <div className="contact-also-links">
                <Link to="/help" className="contact-also-btn">Help & FAQs</Link>
                <Link to="/privacy" state={{ tab: 'privacy' }} className="contact-also-btn">Privacy Policy</Link>
              </div>
            </div>
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

export default Contact;