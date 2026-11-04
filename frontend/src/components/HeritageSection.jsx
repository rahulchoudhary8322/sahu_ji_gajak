import React from 'react';
import '../styles/HeritageSection.css';

/**
 * A Legacy of Tradition - Heritage Section
 * Matches reference image layout:
 * - Left: Golden plate with Gajak set against royal palace outlines
 * - Right: Heading with golden flourish, authentic legacy description, and "Know More ->" button
 */
export default function HeritageSection({ onOpenAbout }) {
  return (
    <section className="royal-heritage-section" id="about">
      <div className="heritage-bg-overlay" aria-hidden="true" />

      <div className="heritage-container">
        {/* Left Side: Traditional Golden Plate Photo */}
        <div className="heritage-image-column">
          <div className="heritage-plate-frame">
            <div className="plate-halo-glow" />
            <img
              src="/assets/heritage/heritage-plate.jpg"
              alt="Traditional Royal Gajak on Antique Brass Platter"
              className="heritage-plate-img"
              loading="eager"
            />
          </div>
        </div>

        {/* Right Side: Royal Story & Content */}
        <div className="heritage-text-column">
          <div className="heritage-heading-wrapper">
            <h2 className="heritage-title">A Legacy of Tradition</h2>
            <div className="heritage-gold-flourish">
              <span className="flourish-bar" />
              <span className="flourish-diamond">◆</span>
            </div>
          </div>

          <p className="heritage-description">
            For generations, Sahu Ji Gajak has been synonymous with purity,
            taste and tradition. Made with the finest ingredients and
            traditional recipes, our gajak brings the royal taste of India to
            your home.
          </p>

          {/* Heritage Key Pillars */}
          <div className="heritage-pillars-grid">
            <div className="pillar-item">
              <span className="pillar-icon">✦</span>
              <span className="pillar-label">100% Pure Desi Ghee</span>
            </div>
            <div className="pillar-item">
              <span className="pillar-icon">✦</span>
              <span className="pillar-label">Authentic Jaipur Recipes</span>
            </div>
            <div className="pillar-item">
              <span className="pillar-icon">✦</span>
              <span className="pillar-label">Wood-Fired Roasted Til</span>
            </div>
            <div className="pillar-item">
              <span className="pillar-icon">✦</span>
              <span className="pillar-label">No Artificial Colors</span>
            </div>
          </div>

          {/* "Know More ->" Button */}
          <div className="heritage-cta-wrapper">
            <button
              className="heritage-know-more-btn"
              onClick={onOpenAbout}
              title="Know More About Our Royal Heritage"
            >
              <span>Know More</span>
              <svg viewBox="0 0 20 20" fill="none" className="know-more-arrow">
                <path
                  d="M4 10H16M16 10L11 5M16 10L11 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

