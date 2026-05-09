import React, { useEffect, useState } from 'react';
import { BsQrCode } from 'react-icons/bs';
import API from '../../apis/api';
import './TrackingQrCode.css';

function TrackingQrCode({
  trackingNumber,
  title = 'QR Code',
  subtitle = '',
  size = 'default',
  showTrackingNumber = true,
  className = '',
}) {
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!trackingNumber || trackingNumber === '-') {
      setQrCodeImage('');
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    const loadQrCode = async () => {
      setIsLoading(true);

      try {
        const response = await API.get(`/generate-qr/${encodeURIComponent(trackingNumber)}`);

        if (isMounted) {
          setQrCodeImage(response?.data?.qrCode || '');
        }
      } catch {
        if (isMounted) {
          setQrCodeImage('');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadQrCode();

    return () => {
      isMounted = false;
    };
  }, [trackingNumber]);

  return (
    <div className={`tracking-qr-widget tracking-qr-widget--${size} ${className}`.trim()}>
      {title || subtitle ? (
        <div className="tracking-qr-widget__header">
          {title ? <h3 className="tracking-qr-widget__title">{title}</h3> : null}
          {subtitle ? <p className="tracking-qr-widget__subtitle">{subtitle}</p> : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="tracking-qr-widget__state tracking-qr-widget__state--loading">
          <div
            className="spinner-border text-primary tracking-qr-widget__spinner"
            role="status"
            aria-hidden="true"
          />
          <span className="tracking-qr-widget__message">جاري تحميل الرمز...</span>
        </div>
      ) : qrCodeImage ? (
        <div className="tracking-qr-widget__content">
          <div className="tracking-qr-widget__frame">
            <img
              src={qrCodeImage}
              alt={`QR code for shipment ${trackingNumber}`}
              className="tracking-qr-widget__image"
            />
          </div>
          {showTrackingNumber ? (
            <p className="tracking-qr-widget__tracking-number" dir="ltr">
              {trackingNumber}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="tracking-qr-widget__state tracking-qr-widget__state--empty">
          <BsQrCode aria-hidden="true" className="tracking-qr-widget__empty-icon" />
          <span className="tracking-qr-widget__message">تعذر تحميل الرمز</span>
        </div>
      )}
    </div>
  );
}

export default TrackingQrCode;
