import React, { useState } from 'react';
import '../styles/VideoSection.css';

/**
 * The Art of Making Gajak - Video Section
 * Directly matching reference image with 3 cards per row on desktop,
 * royal maroon background, golden borders, central play buttons,
 * and responsive gallery for all 12 actual videos.
 */
export default function VideoSection({ onSelectVideo }) {
  // All 12 verified video files from public/video/
  const allVideos = [
    {
      id: 1,
      title: 'Traditional Making Process',
      subtitle: 'Century-old beating & rolling technique',
      src: '/video/video 1.mp4',
      thumbnail: '/assets/videos/thumb-process.jpg',
      duration: '1:45',
      featured: true,
      initialRotation: 270
    },
    {
      id: 2,
      title: 'Pure Ingredients',
      subtitle: 'Organic sesame, organic jaggery & A2 desi ghee',
      src: '/video/video 2.mp4',
      thumbnail: '/assets/videos/thumb-ingredients.jpg',
      duration: '2:10',
      featured: true,
      initialRotation: 0
    },
    {
      id: 3,
      title: 'Our Premium Quality',
      subtitle: 'Hand-sorted dry fruits & royal crunch',
      src: '/video/video 3.mp4',
      thumbnail: '/assets/videos/thumb-quality.jpg',
      duration: '1:55',
      featured: true,
      initialRotation: 270
    },
    {
      id: 4,
      title: 'Roasting Golden Sesame',
      subtitle: 'Slow wood-fired aroma roasting',
      src: '/video/video 4.mp4',
      thumbnail: '/assets/videos/thumb-process.jpg',
      duration: '0:45',
      featured: false,
      initialRotation: 0
    },
    {
      id: 5,
      title: 'Authentic Beating Technique',
      subtitle: 'Rhythmic wooden mallet pounding',
      src: '/video/video 5.mp4',
      thumbnail: '/assets/videos/thumb-ingredients.jpg',
      duration: '2:30',
      featured: false,
      initialRotation: 0
    },
    {
      id: 6,
      title: 'Heritage Jaggery Melt',
      subtitle: 'Pure sugarcane molasses reduction',
      src: '/video/video 6.mp4',
      thumbnail: '/assets/videos/thumb-quality.jpg',
      duration: '1:20',
      featured: false,
      initialRotation: 0
    },
    {
      id: 7,
      title: 'Thin Layer Rolling',
      subtitle: 'Achieving feather-light crispy sheets',
      src: '/video/video 7.mp4',
      thumbnail: '/assets/videos/thumb-process.jpg',
      duration: '1:50',
      featured: false,
      initialRotation: 0
    },
    {
      id: 8,
      title: 'Diamond Cut Precision',
      subtitle: 'Traditional geometry and artisanal slicing',
      src: '/video/video 8.mp4',
      thumbnail: '/assets/videos/thumb-ingredients.jpg',
      duration: '1:15',
      featured: false,
      initialRotation: 0
    },
    {
      id: 9,
      title: 'Handcrafted With Pure Ghee',
      subtitle: 'Rich aroma of traditional Indian bilona ghee',
      src: '/video/video 9.mp4',
      thumbnail: '/assets/videos/thumb-quality.jpg',
      duration: '2:05',
      featured: false,
      initialRotation: 0
    },
    {
      id: 10,
      title: 'Crispy Rewari Craft',
      subtitle: 'Cardamom drop forming & sugar glaze',
      src: '/video/video 10.mp4',
      thumbnail: '/assets/videos/thumb-process.jpg',
      duration: '1:40',
      featured: false,
      initialRotation: 0
    },
    {
      id: 11,
      title: 'Generations of Mastery',
      subtitle: 'Master artisans preserving Jaipur legacy',
      src: '/video/video 11.mp4',
      thumbnail: '/assets/videos/thumb-ingredients.jpg',
      duration: '2:15',
      featured: false,
      initialRotation: 0
    },
    {
      id: 12,
      title: 'Royal Darbar Presentation',
      subtitle: 'Traditional packaging fit for kings',
      src: '/video/video 12.mp4',
      thumbnail: '/assets/videos/thumb-quality.jpg',
      duration: '2:40',
      featured: false,
      initialRotation: 0
    }
  ];

  const [filter, setFilter] = useState('featured'); // 'featured' or 'all'

  const displayedVideos = filter === 'featured' ? allVideos.slice(0, 3) : allVideos;

  return (
    <section className="royal-video-section" id="gallery">
      <div className="video-section-container">
        {/* Ornate Heading with Filigree Wings */}
        <div className="video-header-wrapper">
          <div className="video-heading-row">
            <span className="heading-filigree filigree-left" />
            <h2 className="video-main-heading">The Art of Making Gajak</h2>
            <span className="heading-filigree filigree-right" />
          </div>
          <p className="video-subtitle">Tradition in Every Bite</p>

          {/* Filter Pills */}
          <div className="video-filter-pills">
            <button
              className={`filter-pill ${filter === 'featured' ? 'active' : ''}`}
              onClick={() => setFilter('featured')}
            >
              Featured Crafts (3)
            </button>
            <button
              className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Artisan Videos ({allVideos.length})
            </button>
          </div>
        </div>

        {/* 3 Video Cards Per Row Grid */}
        <div className="video-cards-grid">
          {displayedVideos.map((video) => (
            <div
              key={video.id}
              className="royal-video-card"
              onClick={() => onSelectVideo && onSelectVideo(video)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectVideo && onSelectVideo(video)}
              aria-label={`Play video: ${video.title}`}
            >
              {/* Thumbnail Container */}
              <div className="video-thumbnail-wrapper">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="video-poster-img"
                  loading="eager"
                />
                <div className="video-overlay-tint" />

                {/* Central Circular Play Button */}
                <div className="center-play-button" aria-hidden="true">
                  <div className="play-btn-halo" />
                  <div className="play-btn-circle">
                    <svg viewBox="0 0 24 24" className="play-triangle-svg" fill="none">
                      <path d="M8.5 5.5V18.5L18.5 12L8.5 5.5Z" fill="#FFF0D0" />
                    </svg>
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="video-duration-tag">{video.duration}</span>
              </div>

              {/* Video Title Bar matching reference screenshot */}
              <div className="video-card-info">
                <h3 className="video-card-title">{video.title}</h3>
                {filter === 'all' && (
                  <p className="video-card-subtitle">{video.subtitle}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

