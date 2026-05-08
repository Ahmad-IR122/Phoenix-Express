const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
  

router.get('/:trackingNumber' , async (req, res) => {
  try{
  const { trackingNumber } = req.params;
  const qrData = `http://localhost:5000/track/${trackingNumber}`;
  const qrCodeImage = await QRCode.toDataURL(qrData);
  res.json({
    success: true,
    trackingNumber,
    qrCode: qrCodeImage,
  });

  }catch(error){
  res.status(500).json({
      success: false,
      message: "Failed to generate QR code",
    });
  }
});

module.exports = router;
