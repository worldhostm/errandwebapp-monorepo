import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Errand, { IErrand } from '../models/Errand';
import Chat from '../models/Chat';
import { AuthRequest } from '../middleware/auth';

export const createErrand = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const errandData = {
      ...req.body,
      requestedBy: user._id
    };

    const errand = new Errand(errandData);
    await errand.save();
    await errand.populate('requestedBy', 'name email rating');

    res.status(201).json({
      success: true,
      errand
    });
  } catch (error) {
    console.error('Create errand error:', error);
    res.status(500).json({ error: 'Server error while creating errand' });
  }
};

export const getNearbyErrands = async (req: Request, res: Response) => {
  try {
    const { lng, lat, radius = 5000, status = 'pending', limit = 20, page = 1 } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const longitude = parseFloat(lng as string);
    const latitude = parseFloat(lat as string);
    const radiusInMeters = parseInt(radius as string);
    const limitNum = parseInt(limit as string);
    const skip = (parseInt(page as string) - 1) * limitNum;

    const errands = await Errand.find({
      status,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusInMeters
        }
      }
    })
    .populate('requestedBy', 'name rating totalErrands')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

    res.json({
      success: true,
      errands,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total: errands.length
      }
    });
  } catch (error) {
    console.error('Get nearby errands error:', error);
    res.status(500).json({ error: 'Server error while fetching errands' });
  }
};

export const getErrandById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const errand = await Errand.findById(id)
      .populate('requestedBy', 'name email rating totalErrands')
      .populate('acceptedBy', 'name email rating totalErrands');
    
    if (!errand) {
      return res.status(404).json({ error: 'Errand not found' });
    }

    res.json({
      success: true,
      errand
    });
  } catch (error) {
    console.error('Get errand error:', error);
    res.status(500).json({ error: 'Server error while fetching errand' });
  }
};

export const acceptErrand = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    
    const errand = await Errand.findById(id);
    if (!errand) {
      return res.status(404).json({ error: 'Errand not found' });
    }

    if (errand.status !== 'pending') {
      return res.status(400).json({ error: 'Errand is not available for acceptance' });
    }

    if (errand.requestedBy.toString() === (user._id as mongoose.Types.ObjectId).toString()) {
      return res.status(400).json({ error: 'Cannot accept your own errand' });
    }

    errand.acceptedBy = user._id as mongoose.Types.ObjectId;
    errand.status = 'accepted';
    await errand.save();

    // Create chat for the errand
    const chat = new Chat({
      errand: errand._id,
      participants: [errand.requestedBy, user._id],
      messages: []
    });
    await chat.save();

    await errand.populate('requestedBy', 'name email rating');
    await errand.populate('acceptedBy', 'name email rating');

    res.json({
      success: true,
      errand
    });
  } catch (error) {
    console.error('Accept errand error:', error);
    res.status(500).json({ error: 'Server error while accepting errand' });
  }
};

export const updateErrandStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { status } = req.body;
    
    if (!['in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const errand = await Errand.findById(id);
    if (!errand) {
      return res.status(404).json({ error: 'Errand not found' });
    }

    // Only the person who accepted the errand can update its status
    if (!errand.acceptedBy || errand.acceptedBy.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      return res.status(403).json({ error: 'Not authorized to update this errand' });
    }

    errand.status = status;
    await errand.save();
    await errand.populate('requestedBy', 'name email rating');
    await errand.populate('acceptedBy', 'name email rating');

    res.json({
      success: true,
      errand
    });
  } catch (error) {
    console.error('Update errand status error:', error);
    res.status(500).json({ error: 'Server error while updating errand' });
  }
};

export const getUserErrands = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { type = 'all', status, limit = 20, page = 1 } = req.query;
    const limitNum = parseInt(limit as string);
    const skip = (parseInt(page as string) - 1) * limitNum;

    let query: any = {};
    
    if (type === 'requested') {
      query.requestedBy = user._id;
    } else if (type === 'accepted') {
      query.acceptedBy = user._id;
    } else {
      query.$or = [
        { requestedBy: user._id },
        { acceptedBy: user._id }
      ];
    }

    if (status) {
      query.status = status;
    }

    const errands = await Errand.find(query)
      .populate('requestedBy', 'name email rating')
      .populate('acceptedBy', 'name email rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Errand.countDocuments(query);

    res.json({
      success: true,
      errands,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user errands error:', error);
    res.status(500).json({ error: 'Server error while fetching user errands' });
  }
};

export const cancelErrand = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    
    const errand = await Errand.findById(id);
    if (!errand) {
      return res.status(404).json({ error: 'Errand not found' });
    }

    // Only the person who requested the errand can cancel it
    if (errand.requestedBy.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this errand' });
    }

    if (['completed', 'cancelled'].includes(errand.status)) {
      return res.status(400).json({ error: 'Cannot cancel a completed or already cancelled errand' });
    }

    errand.status = 'cancelled';
    await errand.save();

    res.json({
      success: true,
      message: 'Errand cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel errand error:', error);
    res.status(500).json({ error: 'Server error while cancelling errand' });
  }
};