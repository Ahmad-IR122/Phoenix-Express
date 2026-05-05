require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = 5000;
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");
const articleRoutes = require("./routes/article.routes");
const authRoutes = require("./routes/auth.routes");
const customerRoutes = require("./routes/customer.routes");
const employeeRoutes = require("./routes/employee.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const orderRoutes = require("./routes/order.routes");
const shipmentRoutes = require("./routes/shipment.routes");
const trackingRoutes = require("./routes/tracking.routes");
const vehicleRoutes = require("./routes/vehicle.routes");
const walletRoutes = require("./routes/wallet.routes");
const supportChatRoutes = require("./routes/supportChat.routes");
app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);
app.use(express.json());

/*   <!-- AHMAD code  --> */
app.use("/api/admin", adminRoutes);
app.use("/api/admins", adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/support-chat', supportChatRoutes);
/*   <!-- END of AHMAD code  --> */

/*   <!-- RAGHAD  code  --> */

/*   <!-- END of RAGHAD code  --> */

/*   <!-- AMAAL code  --> */

/*   <!-- END of AMAAL code  --> */
app.get("/", (req, res) => {
  res.send("Hello from the backend server!");
});

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});
