import React from 'react';
import '../styles/PolicyModal.css';

/**
 * Royal Information & Policy Modal
 * Supports FAQs, Shipping Info, Returns & Refunds, and Heritage Story.
 */
export default function PolicyModal({ type, onClose }) {
  if (!type) return null;

  const contentMap = {
    faqs: {
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about our royal sweets',
      items: [
        {
          q: 'How fresh is Sahu Ji Gajak upon delivery?',
          a: 'Every batch of our gajak is handcrafted daily using traditional methods and packed in airtight royal sealed containers to guarantee peak crispness and freshness.'
        },
        {
          q: 'What is the shelf life of your Gajak and Rewari?',
          a: 'Our dry fruit and sesame gajak has a shelf life of up to 4 months when stored in a cool, dry place away from direct sunlight.'
        },
        {
          q: 'Do you use pure desi ghee?',
          a: 'Yes, absolutely. We use 100% pure A2 cow desi ghee and supreme organic jaggery without any artificial additives or preservatives.'
        },
        {
          q: 'Do you deliver across India?',
          a: 'Yes! We deliver across 27,000+ pin codes in India with express royal packaging within 2 to 4 business days.'
        }
      ]
    },
    shipping: {
      title: 'Royal Shipping & Delivery',
      subtitle: 'Safe, prompt, and royal handling of every order',
      items: [
        {
          q: 'Delivery Timelines',
          a: 'Metro cities: 2-3 business days. Rest of India: 3-5 business days. Remote locations: 5-7 business days.'
        },
        {
          q: 'Shipping Charges',
          a: 'We offer Free Royal Delivery on all orders above ₹499. For orders under ₹499, a flat nominal delivery charge of ₹49 applies.'
        },
        {
          q: 'Special Sweets Packaging',
          a: 'Our products are packed in moisture-resistant tamper-evident royal tins and cushioned corrugated boxes to prevent breakage in transit.'
        }
      ]
    },
    returns: {
      title: 'Returns & Refunds Policy',
      subtitle: 'Your absolute satisfaction is our royal commitment',
      items: [
        {
          q: 'Damaged or Tampered Package',
          a: 'If your shipment arrives damaged or tampered, please contact our helpline within 24 hours of delivery. We will promptly dispatch a replacement or issue a full refund.'
        },
        {
          q: 'Refund Processing Time',
          a: 'Refunds are credited back to your original payment method (UPI, Netbanking, Cards) within 3 to 5 business days via Razorpay.'
        },
        {
          q: 'Perishable Goods Return',
          a: 'As our products are perishable traditional food items, we do not accept returns once opened, but customer satisfaction is 100% guaranteed.'
        }
      ]
    },
    about: {
      title: 'A Legacy of Jaipur Heritage',
      subtitle: 'Centuries of royal confectionery mastery',
      items: [
        {
          q: 'Our Royal Origins',
          a: 'Founded in the historic lanes of Jaipur, Sahu Ji Gajak has been serving royal families and connoisseurs of authentic Indian sweets since generations.'
        },
        {
          q: 'Artisanal Handcrafting',
          a: 'Unlike mass-produced sweets, every layer of our gajak is beaten with wooden mallets over 100 times to create the unmistakable crisp, melt-in-the-mouth texture.'
        },
        {
          q: 'Only the Purest Ingredients',
          a: 'We hand-select winter-harvest sesame from Rajasthan, organic dark jaggery from sugarcane mills, and pure churned desi ghee.'
        }
      ]
    },
    contact: {
      title: 'Contact Royal Helpline',
      subtitle: 'We are here to assist your royal experience',
      items: [
        {
          q: 'Customer Care Helpline',
          a: 'Call or WhatsApp: +91 98765 43210 (Available 9:00 AM - 9:00 PM IST, Monday to Sunday)'
        },
        {
          q: 'Official Email Support',
          a: 'Email: info@shahigajak.com • Responses guaranteed within 2 business hours.'
        },
        {
          q: 'Heritage Flagship Store',
          a: 'Johari Bazaar / MI Road Heritage Corridor, Jaipur, Rajasthan - 302001, India.'
        }
      ]
    },
    checkout: {
      title: 'Royal Express Checkout',
      subtitle: 'Secure payments powered by Razorpay, UPI & Net Banking',
      items: [
        {
          q: 'Accepted Payment Methods',
          a: 'We accept all major UPI apps (Google Pay, PhonePe, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Cash on Delivery (COD) in select pin codes.'
        },
        {
          q: 'Safe & Secure Transaction',
          a: 'Your payments are encrypted with 256-bit bank-grade SSL security through Razorpay. No card details are ever stored on our servers.'
        },
        {
          q: 'Express Despatch & Tracking',
          a: 'Orders placed before 2:00 PM are dispatched on the same day from Jaipur in premium sealed protective tins with live SMS tracking.'
        }
      ]
    }
  };

  const current = contentMap[type] || contentMap.faqs;

  return (
    <div className="policy-modal-overlay" onClick={onClose}>
      <div className="policy-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="policy-modal-header">
          <div className="policy-title-box">
            <span className="policy-badge">✦ Royal Information</span>
            <h3 className="policy-modal-title">{current.title}</h3>
            <p className="policy-modal-subtitle">{current.subtitle}</p>
          </div>
          <button className="policy-modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="policy-modal-body">
          {current.items.map((item, idx) => (
            <div key={idx} className="policy-item-box">
              <h4 className="policy-q">
                <span className="q-sparkle">✦</span>
                {item.q}
              </h4>
              <p className="policy-a">{item.a}</p>
            </div>
          ))}
        </div>

        <div className="policy-modal-footer">
          <p className="policy-footer-note">
            Need urgent assistance? Call our Royal Helpline at <strong>+91 98765 43210</strong>
          </p>
          <button className="policy-close-action-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
