const express = require('express');
const { body, validationResult } = require('express-validator');
const { Report, User } = require('../models');
const { sendCityNotification } = require('../services/emailService');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for report submissions
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 reports per hour
  message: 'Too many reports submitted, please try again later.',
});

// Validation middleware
const validateReport = [
  body('location.latitude').isFloat({ min: 35.95, max: 36.05 }).withMessage('Invalid latitude'),
  body('location.longitude').isFloat({ min: -84.35, max: -84.25 }).withMessage('Invalid longitude'),
  body('address').notEmpty().withMessage('Address is required'),
  body('animalType').isIn(['Deer', 'Raccoon', 'Opossum', 'Cat', 'Dog', 'Squirrel', 'Rabbit', 'Other']).withMessage('Invalid animal type'),
  body('size').isIn(['Small', 'Medium', 'Large']).withMessage('Invalid size'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('contactEmail').optional().isEmail().withMessage('Invalid email'),
  body('contactPhone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Invalid phone number'),
];

// Submit a new report
router.post('/', submitLimiter, validateReport, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      location,
      address,
      animalType,
      size,
      description,
      photoUrl,
      contactEmail,
      contactPhone,
      sendUpdates,
    } = req.body;

    // Check for duplicate reports in the same area
    const nearbyReports = await Report.findNearby(
      location.latitude,
      location.longitude,
      100 // 100 meters
    );

    const recentReports = nearbyReports.filter(
      report => new Date() - new Date(report.createdAt) < 60 * 60 * 1000 // 1 hour
    );

    if (recentReports.length > 0) {
      return res.status(409).json({
        error: 'Duplicate Report',
        message: 'A similar report was submitted recently in this area',
      });
    }

    // Create the report
    const report = await Report.create({
      userId: req.user?.id || null,
      location,
      address,
      animalType,
      size,
      description,
      photoUrl,
      contactEmail,
      contactPhone,
      sendUpdates,
    });

    // Send notification to city
    try {
      await sendCityNotification(report);
      await report.update({ 
        status: 'submitted',
        submittedToCityAt: new Date()
      });
    } catch (emailError) {
      console.error('Failed to send city notification:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      reportId: report.id,
      status: report.status,
      message: 'Report submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit report',
    });
  }
});

// Get user's reports (requires authentication)
router.get('/user', auth, async (req, res) => {
  try {
    const reports = await Report.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    res.json({ reports });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch reports',
    });
  }
});

// Get a specific report
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email'],
        },
      ],
    });

    if (!report) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found',
      });
    }

    res.json({ report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch report',
    });
  }
});

// Update report status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, cityResponse } = req.body;

    if (!['pending', 'submitted', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid Status',
        message: 'Invalid status value',
      });
    }

    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found',
      });
    }

    const updateData = { status };
    
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }
    
    if (cityResponse) {
      updateData.cityResponse = cityResponse;
    }

    await report.update(updateData);

    res.json({ 
      report,
      message: 'Report status updated successfully' 
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update report status',
    });
  }
});

// Get reports by status (admin only)
router.get('/status/:status', auth, async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!['pending', 'submitted', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid Status',
        message: 'Invalid status value',
      });
    }

    const offset = (page - 1) * limit;
    
    const reports = await Report.findAndCountAll({
      where: { status },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      reports: reports.rows,
      total: reports.count,
      page: parseInt(page),
      totalPages: Math.ceil(reports.count / limit),
    });
  } catch (error) {
    console.error('Error fetching reports by status:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch reports',
    });
  }
});

module.exports = router; 