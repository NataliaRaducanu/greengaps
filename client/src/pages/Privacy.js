import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { MdSecurity, MdDirectionsBike, MdVisibility, MdEdit, MdDelete, MdDownload } from 'react-icons/md';
import './Privacy.css';

const Privacy = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'privacy');

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  return (
    <div className="privacy-page">
      <Navbar />

      {/* Hero */}
      <section className="privacy-hero">
        <div className="privacy-hero-icon">
          <MdSecurity size={28} color="#2d7a4f" />
        </div>
        <h1>Privacy Policy & Terms</h1>
        <p>Last updated: April 20, 2026</p>
      </section>

      {/* Tabs + Content */}
      <section className="privacy-main">
        <div className="privacy-container">

          {/* Tabs */}
          <div className="privacy-tabs">
            <button className={activeTab === 'privacy' ? 'active' : ''} onClick={() => setActiveTab('privacy')}>Privacy Policy</button>
            <button className={activeTab === 'terms' ? 'active' : ''} onClick={() => setActiveTab('terms')}>Terms of Service</button>
            <button className={activeTab === 'cookies' ? 'active' : ''} onClick={() => setActiveTab('cookies')}>Cookie Policy</button>
          </div>

          {/* Privacy Policy */}
          {activeTab === 'privacy' && (
            <div className="privacy-content">
              <div className="policy-section">
                <h2>1. Information We Collect</h2>
                <p>When you use GreenGaps, we collect information to provide and improve our services:</p>
                <ul>
                  <li>Account information (name, email address, password)</li>
                  <li>Report data (location, description, photos, timestamps)</li>
                  <li>Usage data (pages visited, features used, time spent)</li>
                  <li>Device information (browser type, IP address, operating system)</li>
                </ul>
              </div>
              <div className="policy-section">
                <h2>2. How We Use Your Information</h2>
                <div className="policy-highlight">
                  <span className="policy-highlight-icon">✓</span>
                  <p>Your data helps improve cycling infrastructure in Birmingham. All submitted reports are shared with city planners and transport authorities.</p>
                </div>
                <ul>
                  <li>To process and manage your infrastructure gap reports</li>
                  <li>To communicate updates about your submissions</li>
                  <li>To analyse trends and improve urban planning</li>
                  <li>To maintain and improve the GreenGaps platform</li>
                </ul>
              </div>
              <div className="policy-section">
                <h2>3. Data Sharing & Disclosure</h2>
                <p>We share your information with:</p>
                <ul>
                  <li><strong>Birmingham City Council:</strong> For infrastructure planning and improvement</li>
                  <li><strong>Transport Authorities:</strong> To inform cycling policy decisions</li>
                  <li><strong>Research Partners:</strong> Anonymised data for academic research</li>
                </ul>
                <p>We do not sell your personal information to third parties.</p>
              </div>
              <div className="policy-section">
                <h2>4. Your Rights (GDPR)</h2>
                <div className="policy-rights-grid">
                  <div className="policy-right-card">
                    <MdVisibility size={20} color="#2d7a4f" />
                    <div>
                      <strong>Right to Access</strong>
                      <p>Request a copy of your personal data</p>
                    </div>
                  </div>
                  <div className="policy-right-card">
                    <MdEdit size={20} color="#2d7a4f" />
                    <div>
                      <strong>Right to Rectification</strong>
                      <p>Correct inaccurate information</p>
                    </div>
                  </div>
                  <div className="policy-right-card">
                    <MdDelete size={20} color="#2d7a4f" />
                    <div>
                      <strong>Right to Erasure</strong>
                      <p>Request deletion of your data</p>
                    </div>
                  </div>
                  <div className="policy-right-card">
                    <MdDownload size={20} color="#2d7a4f" />
                    <div>
                      <strong>Right to Portability</strong>
                      <p>Receive your data in portable format</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="policy-section">
                <h2>5. Data Security</h2>
                <p>We implement industry-standard security measures to protect your data:</p>
                <ul>
                  <li>Encrypted data transmission (HTTPS/SSL)</li>
                  <li>Secure password hashing</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                </ul>
              </div>
              <div className="policy-section">
                <h2>6. Contact Us</h2>
                <p>For privacy-related questions or to exercise your rights:</p>
                <p>Email: <a href="mailto:privacy@greengaps.uk" className="policy-link">privacy@greengaps.uk</a></p>
                <p>Data Protection Officer: Sarah Wilson</p>
              </div>
            </div>
          )}

          {/* Terms of Service */}
          {activeTab === 'terms' && (
            <div className="privacy-content">
              <div className="policy-section">
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing and using GreenGaps, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.</p>
              </div>
              <div className="policy-section">
                <h2>2. Use of the Platform</h2>
                <p>You agree to use GreenGaps only for lawful purposes. You must not:</p>
                <ul>
                  <li>Submit false or misleading reports</li>
                  <li>Use the platform to harass or harm others</li>
                  <li>Attempt to gain unauthorised access to any part of the platform</li>
                  <li>Use automated tools to scrape or collect data</li>
                </ul>
              </div>
              <div className="policy-section">
                <h2>3. User Accounts</h2>
                <p>You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorised use of your account. We reserve the right to suspend or terminate accounts that violate these terms.</p>
              </div>
              <div className="policy-section">
                <h2>4. Report Submissions</h2>
                <p>By submitting a report, you grant GreenGaps and Birmingham City Council a non-exclusive licence to use the submitted data for infrastructure planning purposes. You confirm that your submissions are accurate to the best of your knowledge.</p>
              </div>
              <div className="policy-section">
                <h2>5. Intellectual Property</h2>
                <p>The GreenGaps platform, including its design, code, and content, is owned by the GreenGaps team. User-submitted report data remains the property of the submitting user, subject to the licence granted above.</p>
              </div>
              <div className="policy-section">
                <h2>6. Limitation of Liability</h2>
                <p>GreenGaps is provided as-is. We do not guarantee that the platform will be error-free or uninterrupted. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
              </div>
              <div className="policy-section">
                <h2>7. Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms. We will notify users of significant changes via email.</p>
              </div>
              <div className="policy-section">
                <h2>8. Contact</h2>
                <p>For questions about these Terms of Service, contact us at:</p>
                <p>Email: <a href="mailto:legal@greengaps.uk" className="policy-link">legal@greengaps.uk</a></p>
              </div>
            </div>
          )}

          {/* Cookie Policy */}
          {activeTab === 'cookies' && (
            <div className="privacy-content">
              <div className="policy-section">
                <h2>1. What Are Cookies</h2>
                <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience.</p>
              </div>
              <div className="policy-section">
                <h2>2. How We Use Cookies</h2>
                <p>GreenGaps uses minimal cookies to operate the platform:</p>
                <div className="policy-highlight">
                  <span className="policy-highlight-icon">✓</span>
                  <p>We do not use tracking cookies, advertising cookies, or third-party analytics cookies.</p>
                </div>
              </div>
              <div className="policy-section">
                <h2>3. Authentication Token</h2>
                <p>We store a JSON Web Token (JWT) in your browser's local storage to keep you logged in between sessions. This is not a cookie but serves a similar purpose. It contains:</p>
                <ul>
                  <li>Your user ID</li>
                  <li>Your account email</li>
                  <li>An expiry timestamp</li>
                </ul>
                <p>This token is removed when you sign out or when it expires.</p>
              </div>
              <div className="policy-section">
                <h2>4. Third-Party Cookies</h2>
                <p>GreenGaps uses OpenStreetMap for map tiles. OpenStreetMap may set cookies in accordance with their own privacy policy. We have no control over these cookies and recommend reviewing the OpenStreetMap Foundation's privacy policy for details.</p>
              </div>
              <div className="policy-section">
                <h2>5. Managing Cookies</h2>
                <p>You can control and delete cookies through your browser settings. Note that disabling certain cookies may affect the functionality of the platform. To clear your GreenGaps login token, simply sign out of your account.</p>
              </div>
              <div className="policy-section">
                <h2>6. Contact</h2>
                <p>For questions about our Cookie Policy, contact us at:</p>
                <p>Email: <a href="mailto:privacy@greengaps.uk" className="policy-link">privacy@greengaps.uk</a></p>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Contact */}
      <section className="privacy-contact">
        <h2>Questions about your privacy?</h2>
        <p>Our team is happy to help with any data-related questions or requests.</p>
        <Link to="/contact" className="privacy-contact-btn">Contact Us</Link>
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

export default Privacy;