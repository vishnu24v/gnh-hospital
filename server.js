const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gnh_hospital')
  .then(() => console.log('🚀 [DEBUG] MongoDB Connected Successfully!'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Mongoose Schemas
const patientSchema = new mongoose.Schema({
  uhid: { type: String, unique: true },
  name: String,
  dob: String,
  gender: String,
  mobile: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});

const appointmentSchema = new mongoose.Schema({
  uhid: String,
  doctor: String,
  date: String,
  time: String,
  fee: Number,
  regFee: Number,
  total: Number,
  status: { type: String, default: 'Confirmed' },
  createdAt: { type: Date, default: Date.now }
});

const blogSchema = new mongoose.Schema({
  title: String,
  author: String,
  date: String,
  excerpt: String,
  content: String,
  image: String,
  category: String,
  createdAt: { type: Date, default: Date.now }
});

const newsSchema = new mongoose.Schema({
  title: String,
  tag: String,
  date: String,
  content: String,
  image: String,
  createdAt: { type: Date, default: Date.now }
});

const Patient = mongoose.model('Patient', patientSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Blog = mongoose.model('Blog', blogSchema);
const News = mongoose.model('News', newsSchema);

// API Routes
app.post('/api/patients/register', async (req, res) => {
  try {
    const uhid = 'GNH' + Math.floor(100000 + Math.random() * 900000);
    const patient = new Patient({ ...req.body, uhid });
    await patient.save();
    res.status(201).json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

app.get('/api/patients/search/:uhid', async (req, res) => {
  try {
    const patient = await Patient.findOne({ uhid: req.params.uhid });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    
    // Email Notification
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: 'GNH Hospital',
      to: 'vaishnavvishnu052@gmail.com', // Owner email
      subject: 'New Appointment Booking - GNH Hospital',
      html: `<h2>New Appointment</h2><p><strong>UHID:</strong> ${appointment.uhid}</p><p><strong>Doctor:</strong> ${appointment.doctor}</p><p><strong>Time:</strong> ${appointment.date} ${appointment.time}</p>`
    };
    
    await transporter.sendMail(mailOptions).catch(err => console.error('Email failed', err));

    res.status(201).json({ success: true, appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

app.get('/api/appointments/booked/:doctor/:date', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.params.doctor, date: req.params.date });
    const bookedSlots = appointments.map(a => a.time);
    res.json({ success: true, bookedSlots });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 [GNH] Server listening on port ${PORT}`);
});
