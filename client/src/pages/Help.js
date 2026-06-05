import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import {
  MdHelp,
  MdDirectionsBike,
  MdMap,
  MdAddCircleOutline,
  MdNotifications,
  MdPerson,
  MdExpandMore,
  MdExpandLess,
  MdEmail,
} from 'react-icons/md';
import './Help.css';

const faqs = [
  {
    question: 'How do I submit a report?',
    answer: 'Navigate to the Map page, click anywhere on the map where you have identified an infrastructure gap, fill in the report form with details about the issue, and click Submit. Your report will appear on the map immediately.',
  },
  {
    question: 'Do I need an account to view reports?',
    answer: 'No — anyone can browse the map and view existing reports without an account. However, you need to register and log in to submit new reports or receive notifications.',
  },
  {
    question: 'How do I track the status of my report?',
    answer: 'Go to My Reports to see all reports you have submitted along with their current status. You will also receive notifications when your report status changes.',
  },
  {
    question: 'What do the report statuses mean?',
    answer: 'Open means your report has been received and is awaiting review. In Progress means it has been acknowledged and action is being taken. Resolved means the issue has been addressed.',
  },
  {
    question: 'Can I edit or delete a report after submitting?',
    answer: 'You can view your reports in My Reports. To request a change or deletion, please contact us via the Contact page.',
  },
  {
    question: 'How do I turn off email notifications?',
    answer: 'Go to Profile Settings and scroll to Notification Preferences. You can toggle Email Notifications, Report Status Updates, and Weekly Digest on or off.',
  },
  {
    question: 'Who reviews the reports?',
    answer: 'Reports are reviewed by the GreenGaps admin team who categorise and prioritise them before passing relevant reports to Birmingham City Council planners.',
  },
  {
    question: 'Is my personal information safe?',
    answer: 'Yes. We only collect the information needed to operate the platform. Please read our Privacy Policy for full details on how your data is stored and used.',
  },
];

const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faq-question">
        <span>{question}</span>
        {open ? <MdExpandLess size={22} /> : <MdExpandMore size={22} />}
      </div>
      {open && <div className="faq-answer">{answer}</div>}
    </div>
  );
};

const Help = () => {
  return (
    <div className="help-page">
      <Navbar />

      {/* Hero */}
      <section className="help-hero">
        <div className="help-hero-icon">
          <MdHelp size={36} color="white" />
        </div>
        <h1>Help & Support</h1>
        <p>Everything you need to know about using GreenGaps. Can't find what you're looking for? <Link to="/contact" className="help-hero-link">Contact us</Link>.</p>
      </section>

      {/* Getting Started */}
      <section className="help-section white">
        <div className="help-container">
          <h2>Getting Started</h2>
          <div className="help-cards">
            <div className="help-card">
              <div className="help-card-icon">
                <MdPerson size={28} color="#2d7a4f" />
              </div>
              <h3>Create an Account</h3>
              <ol>
                <li>Click <strong>Register</strong> in the top navigation</li>
                <li>Enter your name, email and password</li>
                <li>Submit the form to create your account</li>
                <li>You'll be redirected to the map automatically</li>
              </ol>
            </div>
            <div className="help-card">
              <div className="help-card-icon">
                <MdMap size={28} color="#2d7a4f" />
              </div>
              <h3>Browse the Map</h3>
              <ol>
                <li>Click <strong>Map</strong> in the navigation bar</li>
                <li>Zoom and pan to explore Birmingham</li>
                <li>Click any marker to view report details</li>
                <li>Use the legend to filter by report type</li>
              </ol>
            </div>
            <div className="help-card">
              <div className="help-card-icon">
                <MdAddCircleOutline size={28} color="#2d7a4f" />
              </div>
              <h3>Submit a Report</h3>
              <ol>
                <li>Log in and go to the <strong>Map</strong> page</li>
                <li>Click the location of the infrastructure gap</li>
                <li>Fill in the report form with details</li>
                <li>Click <strong>Submit</strong> to publish your report</li>
              </ol>
            </div>
            <div className="help-card">
              <div className="help-card-icon">
                <MdNotifications size={28} color="#2d7a4f" />
              </div>
              <h3>Manage Notifications</h3>
              <ol>
                <li>Click the bell icon in the top navigation</li>
                <li>View all your recent notifications</li>
                <li>Click a notification to view the related report</li>
                <li>Adjust preferences in <strong>Profile Settings</strong></li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="help-section green-light">
        <div className="help-container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="help-contact">
        <div className="help-contact-icon">
          <MdEmail size={28} color="#2d7a4f" />
        </div>
        <h2>Still need help?</h2>
        <p>Our support team is happy to assist with any questions not covered here.</p>
        <Link to="/contact" className="help-contact-btn">Contact Us</Link>
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

export default Help;