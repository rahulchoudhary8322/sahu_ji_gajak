import React from 'react';
import '../styles/Footer.css';

/**
 * Royal Indian Palace Footer
 * Direct visual match to reference image with 4 columns:
 * 1. Brand Logo & Social Icons
 * 2. Quick Links
 * 3. Customer Care
 * 4. Contact Us (Jaipur address & phone)
 * Bottom Bar: Copyright & Payment Logos (Razorpay, UPI, Visa, Mastercard)
 */
export default function Footer({ onOpenPolicy }) {
  return (
    <footer className="royal-footer" id="contact">
      {/* Top Ornamental Golden Border Accent */}
      <div className="footer-top-border">
        <span className="footer-border-flourish flourish-left" />
        <div className="footer-crown-center">
          <svg viewBox="0 0 40 20" fill="none">
            <path d="M4 18 L8 6 L14 12 L20 2 L26 12 L32 6 L36 18 Z" fill="#F5C65B" stroke="#FFE49E" strokeWidth="1" />
            <circle cx="20" cy="2" r="1.8" fill="#FFE49E" />
            <circle cx="8" cy="6" r="1.4" fill="#D32F2F" />
            <circle cx="32" cy="6" r="1.4" fill="#D32F2F" />
          </svg>
        </div>
        <span className="footer-border-flourish flourish-right" />
      </div>

      <div className="footer-content-container">
        <div className="footer-columns-grid">
          {/* COLUMN 1: BRAND LOGO & SOCIAL */}
          <div className="footer-col footer-col-brand">
            <div className="footer-logo-badge">
              <div className="footer-crown">
                <svg viewBox="0 0 80 32" fill="none">
                  <path d="M10 28 L16 10 L30 18 L40 4 L50 18 L64 10 L70 28 Z" fill="url(#footerGoldGrad)" stroke="#FFE89E" strokeWidth="1" />
                  <rect x="12" y="28" width="56" height="4" rx="1.5" fill="url(#footerGoldGrad)" />
                  <circle cx="40" cy="4" r="2.5" fill="#FFE89E" />
                  <circle cx="16" cy="10" r="2" fill="#D32F2F" />
                  <circle cx="64" cy="10" r="2" fill="#D32F2F" />
                  <defs>
                    <linearGradient id="footerGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF2B8" />
                      <stop offset="50%" stopColor="#F5C65B" />
                      <stop offset="100%" stopColor="#D4A33D" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="footer-brand-plaque">
                <div className="footer-brand-title">Sahu Ji</div>
                <div className="footer-flourish-row">
                  <span className="mini-line" />
                  <span className="footer-brand-sub">Gajak</span>
                  <span className="mini-line" />
                </div>
              </div>
            </div>

            <p className="footer-brand-tagline">
              A royal treat, crafted with love and tradition.
            </p>

            {/* Social Media Icons */}
            <div className="footer-social-icons">
              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon-btn" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>

              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon-btn" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeLinecap="round" />
                </svg>
              </a>

              {/* YouTube */}
              <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-icon-btn" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="social-icon-btn" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
              </a>
            </div>
          </div>

          {/* COLUMN 2: QUICK LINKS */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <div className="footer-title-divider" />
            <ul className="footer-links-list">
              <li><a href="#home">Home</a></li>
              <li><a href="#shop">Shop All</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#gallery">Gallery</a></li>
            </ul>
          </div>

          {/* COLUMN 3: CUSTOMER CARE */}
          <div className="footer-col">
            <h4 className="footer-col-title">Customer Care</h4>
            <div className="footer-title-divider" />
            <ul className="footer-links-list">
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); onOpenPolicy && onOpenPolicy('contact'); }}>Contact Us</a></li>
              <li><a href="#faqs" onClick={(e) => { e.preventDefault(); onOpenPolicy && onOpenPolicy('faqs'); }}>FAQs</a></li>
              <li><a href="#shipping" onClick={(e) => { e.preventDefault(); onOpenPolicy && onOpenPolicy('shipping'); }}>Shipping Info</a></li>
              <li><a href="#returns" onClick={(e) => { e.preventDefault(); onOpenPolicy && onOpenPolicy('returns'); }}>Returns & Refunds</a></li>
            </ul>
          </div>

          {/* COLUMN 4: CONTACT US */}
          <div className="footer-col footer-col-contact">
            <h4 className="footer-col-title">Contact Us</h4>
            <div className="footer-title-divider" />
            <ul className="footer-contact-list">
              <li className="contact-entry">
                <span className="contact-icon">📞</span>
                <a href="tel:+919876543210" className="contact-text">+91 98765 43210</a>
              </li>
              <li className="contact-entry">
                <span className="contact-icon">✉️</span>
                <a href="mailto:info@shahigajak.com" className="contact-text">info@shahigajak.com</a>
              </li>
              <li className="contact-entry">
                <span className="contact-icon">📍</span>
                <span className="contact-text">Jaipur, Rajasthan - 302001</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR: COPYRIGHT & PAYMENT BADGES */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-container">
          <div className="footer-copyright">
            © 2026 Sahu Ji Gajak. All Rights Reserved.
          </div>

          {/* Payment Badges directly matching reference image */}
          <div className="footer-payment-badges">
            <span className="payment-badge razorpay-badge" title="Razorpay Secure">
              <span className="badge-glow-icon">⚡</span>
              <span>Razorpay</span>
            </span>

            <span className="payment-badge upi-badge" title="Unified Payments Interface">
              <span className="upi-symbol">UPI</span>
            </span>

            <span className="payment-badge visa-badge" title="Visa">
              <span className="visa-text">VISA</span>
            </span>

            <span className="payment-badge mastercard-badge" title="Mastercard">
              <span className="mc-circle mc-red" />
              <span className="mc-circle mc-yellow" />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

