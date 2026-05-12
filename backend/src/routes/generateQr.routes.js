const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");

router.get("/:trackingNumber", async (req, res) => {
  const { trackingNumber } = req.params;
  const frontendBaseUrl =
    "http://localhost:3000".replace(/\/$/, "");
  const qrData = `${frontendBaseUrl}/tracking?trackingNumber=${encodeURIComponent(
    trackingNumber,
  )}`;
  try {
    const qrCodeImage = await QRCode.toDataURL(qrData);
    res.json({
      success: true,
      trackingNumber,
      qrCode: qrCodeImage,
    });
  } catch (error) {
    console.error("Failed to generate QR code", {
      trackingNumber,
      qrData,
      error,
    });
    res.status(500).json({
      success: false,
      message: "Failed to generate QR code",
    });
  }
});

module.exports = router;
