// backend/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const paymentsRouter = require('./routes/payments');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api', paymentsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
