import React, { useState, useEffect, useMemo, useCallback } from 'react';
import '../styles/CheckoutPage.css';

// Indian States and Union Territories with standard codes
const INDIAN_STATES = [
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'DL', name: 'Delhi NCR' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'PB', name: 'Punjab' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'TS', name: 'Telangana' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JK', name: 'Jammu & Kashmir' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'OR', name: 'Odisha' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'KL', name: 'Kerala' },
  { code: 'AS', name: 'Assam' },
  { code: 'GA', name: 'Goa' },
  { code: 'CT', name: 'Chhattisgarh' }
];

export default function CheckoutPage({
  cartItems = [],
  onNavigateCart,
  onNavigateShop,
  onNavigateHome,
  onOrderSuccess,
  showToast
}) {
  // 1. Customer Information State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    houseFlat: '',
    streetArea: '',
    landmark: '',
    city: 'Jaipur',
    state: 'RJ',
    pincode: '302001',
    orderNotes: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 2. Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);

  // 3. Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 'cod',
      title: 'Cash on Delivery (COD)',
      description: 'Pay cash upon doorstep delivery of your royal sweets.',
      active: true,
      is_default: true
    },
    {
      id: 'bacs',
      title: 'Direct Bank Transfer / UPI',
      description: 'Transfer directly to our royal bank account (NEFT / IMPS / UPI QR).',
      active: true,
      is_default: false
    },
    {
      id: 'razorpay',
      title: 'Razorpay (UPI / Cards / NetBanking)',
      description: 'Pending store owner Razorpay API keys in WooCommerce settings.',
      active: false,
      configured: false,
      is_default: false
    }
  ]);
  const [selectedPayment, setSelectedPayment] = useState('cod');

  // 4. Shipping Calculation State
  const [shippingInfo, setShippingInfo] = useState({
    cost: 0,
    title: 'Complimentary Royal Delivery',
    zone: 'Rajasthan (Local Express Delivery)'
  });
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  // 5. Order Placement Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // 6. Idempotency Key (generates once per checkout session to prevent duplicate orders)
  const idempotencyKey = useMemo(() => {
    return 'shahi_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }, []);

  // Compute Raw Subtotal from verified cart items
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * item.quantity, 0);
  }, [cartItems]);

  // Compute Discount
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.discount_value || 0;
  }, [appliedCoupon]);

  // Compute Grand Total
  const grandTotal = useMemo(() => {
    const total = subtotal - discountAmount + (shippingInfo.cost || 0);
    return Math.max(0, Math.round(total));
  }, [subtotal, discountAmount, shippingInfo.cost]);

  // Fetch Payment Methods and Shipping Configuration on Mount & Address Change
  useEffect(() => {
    let isCancelled = false;
    setIsCalculatingShipping(true);

    const queryParams = new URLSearchParams({
      action: 'config',
      state: formData.state,
      pincode: formData.pincode,
      subtotal: subtotal.toString()
    });

    fetch(`http://127.0.0.1:8000/api/checkout?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.status === 'success') {
          if (Array.isArray(data.payment_methods) && data.payment_methods.length > 0) {
            setPaymentMethods(data.payment_methods);
            // If currently selected payment method is inactive, switch to default active
            const currentSelected = data.payment_methods.find((m) => m.id === selectedPayment);
            if (!currentSelected || !currentSelected.active) {
              const defaultActive = data.payment_methods.find((m) => m.active);
              if (defaultActive) setSelectedPayment(defaultActive.id);
            }
          }
          if (data.shipping) {
            setShippingInfo({
              cost: data.shipping.cost || 0,
              title: data.shipping.title || 'Free shipping',
              zone: data.shipping.zone || 'Domestic'
            });
          }
        }
      })
      .catch((err) => {
        console.warn('Notice loading checkout configuration:', err.message);
      })
      .finally(() => {
        if (!isCancelled) setIsCalculatingShipping(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [formData.state, formData.pincode, subtotal]);

  // Real-time Field Validation Handler
  const validateField = useCallback((name, value) => {
    let error = null;

    if (name === 'fullName') {
      if (!value || value.trim().length < 3) {
        error = 'Please enter your full name (minimum 3 letters).';
      }
    } else if (name === 'phone') {
      const cleanPhone = value.replace(/[^0-9]/g, '');
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        error = 'Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
      }
    } else if (name === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = 'Please enter a valid email address.';
      }
    } else if (name === 'houseFlat') {
      if (!value || value.trim().length < 2) {
        error = 'House/Flat number and building name are required.';
      }
    } else if (name === 'streetArea') {
      if (!value || value.trim().length < 3) {
        error = 'Street, road, or colony name is required.';
      }
    } else if (name === 'city') {
      if (!value || value.trim().length < 2) {
        error = 'City is required.';
      }
    } else if (name === 'pincode') {
      const cleanPin = value.replace(/[^0-9]/g, '');
      if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
        error = 'Enter a valid 6-digit Indian PIN code.';
      }
    }

    return error;
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setFormErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Validate entire form before submission
  const validateAll = () => {
    const errors = {};
    const fieldsToValidate = ['fullName', 'phone', 'email', 'houseFlat', 'streetArea', 'city', 'pincode'];

    fieldsToValidate.forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) errors[field] = err;
    });

    setFormErrors(errors);
    setTouched(
      fieldsToValidate.reduce((acc, f) => {
        acc[f] = true;
        return acc;
      }, {})
    );

    return Object.keys(errors).length === 0;
  };

  // Coupon Application Handler
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_coupon',
          code,
          subtotal
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setAppliedCoupon(data);
        setCouponInput('');
        if (showToast) showToast(data.message);
      } else {
        setCouponError(data.message || 'Invalid coupon code.');
      }
    } catch (err) {
      setCouponError('Could not validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    const oldCode = appliedCoupon?.code;
    setAppliedCoupon(null);
    setCouponError(null);
    if (showToast) showToast(`Coupon "${oldCode}" removed.`);
  };

  // Place Order Submission Handler
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setServerError(null);

    if (cartItems.length === 0) {
      setServerError('Your royal basket is empty. Please add items to proceed.');
      return;
    }

    const isValid = validateAll();
    if (!isValid) {
      setServerError('Please review and correct the highlighted fields in your details.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        action: 'create_order',
        idempotency_key: idempotencyKey,
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        house_flat: formData.houseFlat.trim(),
        street_area: formData.streetArea.trim(),
        landmark: formData.landmark.trim(),
        city: formData.city.trim(),
        state: formData.state,
        pincode: formData.pincode.trim(),
        payment_method: selectedPayment,
        coupon_code: appliedCoupon ? appliedCoupon.code : '',
        order_notes: formData.orderNotes.trim(),
        cart_items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          weight: item.weight || '500g',
          quantity: item.quantity,
          price: item.price
        }))
      };

      const res = await fetch('http://127.0.0.1:8000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        // Clear local storage and notify user
        if (showToast) {
          showToast(`Royal Order #${data.order_number} successfully placed!`);
        }
        if (onOrderSuccess) {
          onOrderSuccess(data);
        }
      } else {
        setServerError(data.message || 'Unable to complete order. Please review your details.');
        window.scrollTo({ top: 140, behavior: 'smooth' });
      }
    } catch (err) {
      setServerError('Network error while processing your order. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If cart is empty, show royal empty basket prompt
  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty-wrapper">
        <div className="checkout-empty-card">
          <div className="empty-crown-icon">👑</div>
          <h2 className="empty-title">Your Royal Basket is Empty</h2>
          <p className="empty-desc">
            To proceed with checkout, please choose from our authentic handcrafted gajak, rewari, and festive gifting selections.
          </p>
          <button className="empty-shop-btn" onClick={onNavigateShop}>
            <span>Explore Royal Collection</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-wrapper">
      {/* Royal Breadcrumbs */}
      <div className="checkout-breadcrumbs">
        <div className="checkout-breadcrumbs-inner">
          <button className="crumb-link" onClick={onNavigateHome}>Home</button>
          <span className="crumb-sep">/</span>
          <button className="crumb-link" onClick={onNavigateCart}>Royal Basket</button>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">Royal Checkout</span>
        </div>
      </div>

      <div className="checkout-container">
        {/* Page Header */}
        <div className="checkout-header-banner">
          <div className="header-crest">
            <span className="crest-crown">👑</span>
          </div>
          <h1 className="checkout-main-title">Royal Checkout & Order Placement</h1>
          <p className="checkout-subtitle">
            Authentic Jaipur Sweets Prepared in 100% Pure Desi Ghee & Wood-Fired Jaggery
          </p>
        </div>

        {/* Global Server Error Banner */}
        {serverError && (
          <div className="checkout-alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <div className="alert-text">{serverError}</div>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} noValidate>
          <div className="checkout-grid-layout">
            {/* LEFT COLUMN: Customer Information, Address, Payment Methods */}
            <div className="checkout-forms-column">
              {/* SECTION 1: CUSTOMER INFORMATION */}
              <div className="checkout-card">
                <div className="card-header">
                  <span className="step-badge">1</span>
                  <h2 className="card-title">Customer Information</h2>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label htmlFor="fullName" className="form-label">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g. Maharaja Vikramaditya"
                      className={`form-input ${formErrors.fullName && touched.fullName ? 'input-error' : ''}`}
                    />
                    {formErrors.fullName && touched.fullName && (
                      <span className="field-error-msg">{formErrors.fullName}</span>
                    )}
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">
                        Mobile Number <span className="req">*</span>
                      </label>
                      <div className="input-prefix-wrapper">
                        <span className="input-prefix">+91</span>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          maxLength={10}
                          value={formData.phone}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          placeholder="9876543210"
                          className={`form-input has-prefix ${formErrors.phone && touched.phone ? 'input-error' : ''}`}
                        />
                      </div>
                      {formErrors.phone && touched.phone && (
                        <span className="field-error-msg">{formErrors.phone}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        Email Address <span className="req">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="yourname@gmail.com"
                        className={`form-input ${formErrors.email && touched.email ? 'input-error' : ''}`}
                      />
                      {formErrors.email && touched.email && (
                        <span className="field-error-msg">{formErrors.email}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DELIVERY ADDRESS */}
              <div className="checkout-card">
                <div className="card-header">
                  <span className="step-badge">2</span>
                  <h2 className="card-title">Delivery Address</h2>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label htmlFor="houseFlat" className="form-label">
                      House / Flat / Building / Suite <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="houseFlat"
                      name="houseFlat"
                      value={formData.houseFlat}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g. Flat 402, Royal Residency, Tower A"
                      className={`form-input ${formErrors.houseFlat && touched.houseFlat ? 'input-error' : ''}`}
                    />
                    {formErrors.houseFlat && touched.houseFlat && (
                      <span className="field-error-msg">{formErrors.houseFlat}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="streetArea" className="form-label">
                      Street / Colony / Sector / Area <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="streetArea"
                      name="streetArea"
                      value={formData.streetArea}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g. M.I. Road, Near Panch Batti"
                      className={`form-input ${formErrors.streetArea && touched.streetArea ? 'input-error' : ''}`}
                    />
                    {formErrors.streetArea && touched.streetArea && (
                      <span className="field-error-msg">{formErrors.streetArea}</span>
                    )}
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label htmlFor="landmark" className="form-label">
                        Landmark <span className="opt">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        id="landmark"
                        name="landmark"
                        value={formData.landmark}
                        onChange={handleInputChange}
                        placeholder="e.g. Opposite City Palace Gate"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="city" className="form-label">
                        City / Town <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="e.g. Jaipur"
                        className={`form-input ${formErrors.city && touched.city ? 'input-error' : ''}`}
                      />
                      {formErrors.city && touched.city && (
                        <span className="field-error-msg">{formErrors.city}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row-3">
                    <div className="form-group">
                      <label htmlFor="state" className="form-label">
                        State <span className="req">*</span>
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        {INDIAN_STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="pincode" className="form-label">
                        PIN Code <span className="req">*</span>
                      </label>
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="302001"
                        className={`form-input ${formErrors.pincode && touched.pincode ? 'input-error' : ''}`}
                      />
                      {formErrors.pincode && touched.pincode && (
                        <span className="field-error-msg">{formErrors.pincode}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="country" className="form-label">
                        Country
                      </label>
                      <input
                        type="text"
                        id="country"
                        value="India"
                        disabled
                        className="form-input disabled"
                      />
                    </div>
                  </div>

                  <div className="form-group mt-3">
                    <label htmlFor="orderNotes" className="form-label">
                      Royal Delivery Instructions <span className="opt">(Optional)</span>
                    </label>
                    <textarea
                      id="orderNotes"
                      name="orderNotes"
                      rows={2}
                      value={formData.orderNotes}
                      onChange={handleInputChange}
                      placeholder="e.g. Ring the bell, please pack in extra festive gifting ribbon."
                      className="form-textarea"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: PAYMENT METHOD */}
              <div className="checkout-card">
                <div className="card-header">
                  <span className="step-badge">3</span>
                  <h2 className="card-title">Payment Method</h2>
                </div>
                <div className="card-body">
                  <div className="payment-options-list">
                    {paymentMethods.map((method) => {
                      const isSelected = selectedPayment === method.id;
                      const isUnavailable = !method.active;

                      return (
                        <label
                          key={method.id}
                          className={`payment-option-card ${isSelected ? 'selected' : ''} ${isUnavailable ? 'disabled' : ''}`}
                        >
                          <div className="payment-radio-row">
                            <input
                              type="radio"
                              name="payment_method"
                              value={method.id}
                              checked={isSelected}
                              disabled={isUnavailable}
                              onChange={() => setSelectedPayment(method.id)}
                              className="payment-radio"
                            />
                            <div className="payment-title-group">
                              <span className="payment-name">{method.title}</span>
                              {method.id === 'cod' && (
                                <span className="payment-pill-green">Most Popular</span>
                              )}
                              {method.id === 'razorpay' && !method.active && (
                                <span className="payment-pill-amber">API Setup Pending</span>
                              )}
                            </div>
                          </div>

                          <p className="payment-desc">{method.description}</p>

                          {/* Details for Direct Bank Transfer */}
                          {method.id === 'bacs' && isSelected && (
                            <div className="bank-details-box">
                              <div className="bank-detail-item">
                                <strong>Bank:</strong> State Bank of India (Jaipur Royal Palace Branch)
                              </div>
                              <div className="bank-detail-item">
                                <strong>Account Name:</strong> Sahu Ji Gajak Pvt. Ltd.
                              </div>
                              <div className="bank-detail-item">
                                <strong>Account Number:</strong> 398201928471
                              </div>
                              <div className="bank-detail-item">
                                <strong>IFSC Code:</strong> SBIN0001234
                              </div>
                              <div className="bank-detail-item">
                                <strong>UPI ID:</strong> shahigajak@sbi
                              </div>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary & Placement */}
            <div className="checkout-summary-column">
              <div className="checkout-card sticky-summary-card">
                <div className="card-header">
                  <h2 className="card-title">Order Summary ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items)</h2>
                  <button type="button" className="btn-edit-cart" onClick={onNavigateCart}>
                    Edit Basket
                  </button>
                </div>

                <div className="card-body">
                  {/* Cart Item Row List */}
                  <div className="checkout-items-list">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="checkout-item-row">
                        <div className="item-thumb-wrapper">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="item-thumb-img"
                            onError={(e) => {
                              e.target.src = '/assets/products/til_gajak_hd.jpg';
                            }}
                          />
                          <span className="item-qty-badge">{item.quantity}</span>
                        </div>
                        <div className="item-details">
                          <h4 className="item-name">{item.name}</h4>
                          <span className="item-weight-pill">{item.weight || '500g'}</span>
                          <span className="item-unit-price">₹{item.price} each</span>
                        </div>
                        <div className="item-subtotal">
                          ₹{Math.round((parseFloat(item.price) || 0) * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Application Box */}
                  <div className="checkout-coupon-section">
                    {!appliedCoupon ? (
                      <div className="coupon-form-row">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="Coupon Code (e.g. SHAHI100)"
                          className="coupon-field"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                          className="coupon-btn"
                        >
                          {couponLoading ? 'Applying...' : 'Apply'}
                        </button>
                      </div>
                    ) : (
                      <div className="applied-coupon-pill">
                        <div className="applied-coupon-info">
                          <span className="coupon-tag-icon">🎟️</span>
                          <div>
                            <strong>{appliedCoupon.code}</strong> Applied
                            <span className="coupon-saving-badge">-₹{appliedCoupon.discount_value}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="btn-remove-coupon"
                          title="Remove Coupon"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {couponError && <p className="coupon-error-notice">{couponError}</p>}
                    {!appliedCoupon && !couponError && (
                      <p className="coupon-hint-notice">💡 Try code <strong>SHAHI100</strong> for ₹100 Royal Discount on orders ≥ ₹500.</p>
                    )}
                  </div>

                  {/* Breakdown Table */}
                  <div className="order-totals-breakdown">
                    <div className="totals-row">
                      <span>Basket Subtotal:</span>
                      <span>₹{subtotal}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="totals-row discount-row">
                        <span>Royal Coupon Discount:</span>
                        <span>-₹{discountAmount}</span>
                      </div>
                    )}

                    <div className="totals-row">
                      <span>Delivery ({shippingInfo.title}):</span>
                      <span>
                        {isCalculatingShipping ? (
                          'Calculating...'
                        ) : shippingInfo.cost === 0 ? (
                          <strong className="free-shipping-text">FREE</strong>
                        ) : (
                          `₹${shippingInfo.cost}`
                        )}
                      </span>
                    </div>

                    <div className="totals-row grand-total-row">
                      <span>Total Payable:</span>
                      <span className="grand-total-amount">₹{grandTotal}</span>
                    </div>
                  </div>

                  {/* PLACE ORDER ACTION BUTTON */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn-place-royal-order ${isSubmitting ? 'submitting' : ''}`}
                  >
                    {isSubmitting ? (
                      <div className="submitting-spinner-row">
                        <span className="royal-spinner" />
                        <span>Confirming Royal Order...</span>
                      </div>
                    ) : (
                      <div className="place-order-content">
                        <span className="order-btn-icon">👑</span>
                        <span className="order-btn-label">Place Royal Order</span>
                        <span className="order-btn-amount">₹{grandTotal}</span>
                      </div>
                    )}
                  </button>

                  <p className="order-terms-notice">
                    By placing your order, you agree to Sahu Ji Gajak’s authentic culinary standards, fresh-batch dispatch guarantee, and terms of service.
                  </p>

                  {/* Security Highlights */}
                  <div className="summary-security-badges">
                    <div className="security-badge-item">
                      <span className="badge-ico">🛡️</span>
                      <span>Encrypted & Safe Checkout</span>
                    </div>
                    <div className="security-badge-item">
                      <span className="badge-ico">📦</span>
                      <span>Damage-Proof Heritage Packaging</span>
                    </div>
                    <div className="security-badge-item">
                      <span className="badge-ico">✨</span>
                      <span>100% Authentic Jaipur Sweets</span>
                    </div>
                  </div>

                  {/* Back to Cart Option */}
                  <button
                    type="button"
                    onClick={onNavigateCart}
                    className="btn-back-to-basket"
                  >
                    ← Return to Royal Basket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

