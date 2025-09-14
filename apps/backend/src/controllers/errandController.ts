import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Errand from '../models/Errand';
import Chat from '../models/Chat';
import { AuthRequest } from '../middleware/auth';
import { createNotification } from './notificationController';

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
    await errand.populate('requestedBy', 'name email rating avatar');

    res.status(201).json({
      success: true,
      errand
    });
  } catch (error) {
    console.error('Create errand error:', error);
    res.status(500).json({ error: 'Server error while creating errand' });
  }
};

// Haversine 공식을 사용한 거리 계산 함수
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const getNearbyErrands = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { 
      lng, 
      lat, 
      radius = 5000, 
      status = 'pending', 
      limit = 20, 
      page = 1,
      // 새로운 bounds 파라미터 추가
      swLat,
      swLng, 
      neLat,
      neLng
    } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ error: 'Longitude and latitude are required' });
    }

    const longitude = parseFloat(lng as string);
    const latitude = parseFloat(lat as string);
    const radiusInMeters = parseInt(radius as string);
    const limitNum = parseInt(limit as string);
    const skip = (parseInt(page as string) - 1) * limitNum;

    const query: Record<string, unknown> = {
      status
    };

    // 자신의 심부름 제외 (로그인한 경우에만, 단 테스트 계정은 예외)
    if (user) {
      const isTestAccount = user.email?.startsWith('test') || user.name?.includes('테스트') || user.name?.includes('운영자');
      
      if (!isTestAccount) {
        query.requestedBy = { $ne: user._id };
        console.log(`🚫 자신의 심부름 제외: ${user.email} (일반 계정)`);
      } else {
        console.log(`✅ 테스트 계정으로 모든 심부름 표시: ${user.email} (${user.name})`);
      }
    }

    let errands;
    let total;

    // Bounds가 제공되면 bounds 기준으로 조회
    if (swLat && swLng && neLat && neLng) {
      const swLatNum = parseFloat(swLat as string);
      const swLngNum = parseFloat(swLng as string);
      const neLatNum = parseFloat(neLat as string);
      const neLngNum = parseFloat(neLng as string);
      
      // Bounds를 약간 확장하여 경계선 근처의 심부름도 포함 (약 1km 확장)
      const expansionDelta = 0.009; // 약 1km (1도 ≈ 111km)
      const expandedSwLat = swLatNum - expansionDelta;
      const expandedSwLng = swLngNum - expansionDelta;
      const expandedNeLat = neLatNum + expansionDelta;
      const expandedNeLng = neLngNum + expansionDelta;
      
      query.location = {
        $geoWithin: {
          $box: [
            [expandedSwLng, expandedSwLat], // 확장된 남서쪽 좌표 [lng, lat]
            [expandedNeLng, expandedNeLat]  // 확장된 북동쪽 좌표 [lng, lat]
          ]
        }
      };
      console.log(`📦 Bounds 기준 조회 (확장됨): 원본 SW(${swLatNum}, ${swLngNum}) - NE(${neLatNum}, ${neLngNum})`);
      console.log(`📦 확장된 범위: SW(${expandedSwLat}, ${expandedSwLng}) - NE(${expandedNeLat}, ${expandedNeLng})`);
      console.log(`🔍 쿼리 조건:`, JSON.stringify(query, null, 2));

      // 디버깅: 모든 심부름 위치 확인
      const allErrandsForDebug = await Errand.find({ status }).select('location title');
      console.log(`🗺️ 모든 ${status} 심부름 위치:`, allErrandsForDebug.map(e => ({
        title: e.title,
        coordinates: e.location.coordinates
      })));

      // Bounds 기준 조회 (정렬 없이)
      errands = await Errand.find(query)
        .populate('requestedBy', 'name rating totalErrands avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      total = await Errand.countDocuments(query);
      
      console.log(`📊 Bounds 조회 결과: ${errands.length}개 심부름 (총 ${total}개)`);
      if (errands.length > 0) {
        console.log(`📍 조회된 심부름들:`, errands.map((e) => ({
          title: e.title,
          coordinates: e.location.coordinates
        })));
      }

    } else {
      // 반경 기준 조회: $geoWithin으로 대체하여 populate 충돌 해결
      const expansionFactor = 1.5; // 반경을 조금 더 크게 잡아서 정확도 향상
      const expandedRadius = radiusInMeters * expansionFactor;
      
      // 대략적인 bounds 계산 (1도 ≈ 111km)
      const latDelta = expandedRadius / 111000;
      const lngDelta = expandedRadius / (111000 * Math.cos(latitude * Math.PI / 180));
      
      query.location = {
        $geoWithin: {
          $box: [
            [longitude - lngDelta, latitude - latDelta], // 남서쪽
            [longitude + lngDelta, latitude + latDelta]  // 북동쪽
          ]
        }
      };
      
      console.log(`🎯 반경 기준 조회 (geoWithin 변환): 중심(${latitude}, ${longitude}), 반경 ${radiusInMeters}m`);

      // 모든 결과를 가져온 후 정확한 거리 계산으로 필터링 및 정렬
      const allErrands = await Errand.find(query)
        .populate('requestedBy', 'name rating totalErrands avatar');

      // 거리 계산 및 필터링
      const errandsWithDistance = allErrands
        .map(errand => {
          const [errandLng, errandLat] = errand.location.coordinates;
          const distance = calculateDistance(latitude, longitude, errandLat, errandLng);
          return {
            ...errand.toObject(),
            distance
          };
        })
        .filter(errand => errand.distance <= radiusInMeters)
        .sort((a, b) => a.distance - b.distance);

      total = errandsWithDistance.length;
      errands = errandsWithDistance.slice(skip, skip + limitNum);
    }

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
    console.error('Get nearby errands error:', error);
    res.status(500).json({ error: 'Server error while fetching errands' });
  }
};

export const getErrandById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const errand = await Errand.findById(id)
      .populate('requestedBy', 'name email rating totalErrands avatar')
      .populate('acceptedBy', 'name email rating totalErrands avatar');
    
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
    
    // Check if user already has an active errand (accepted or in_progress)
    const activeErrand = await Errand.findOne({
      acceptedBy: user._id,
      status: { $in: ['accepted', 'in_progress'] }
    });

    if (activeErrand) {
      return res.status(400).json({ 
        error: '이미 수행 중인 심부름이 있습니다. 현재 심부름을 완료한 후에 새로운 심부름을 수락할 수 있습니다.',
        activeErrand: {
          id: activeErrand._id,
          title: activeErrand.title,
          status: activeErrand.status
        }
      });
    }
    
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

    await errand.populate('requestedBy', 'name email rating avatar');
    await errand.populate('acceptedBy', 'name email rating avatar');

    // 의뢰자에게 수락 알림 생성
    await createNotification(
      errand.requestedBy._id as mongoose.Types.ObjectId,
      '심부름이 수락되었습니다',
      `"${errand.title}" 심부름을 ${user.name}님이 수락했습니다.`,
      'errand_accepted',
      errand._id as mongoose.Types.ObjectId
    );

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
    
    if (!['in_progress'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use /complete-verification for completion.' });
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
    await errand.populate('requestedBy', 'name email rating avatar');
    await errand.populate('acceptedBy', 'name email rating avatar');

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

    const query: Record<string, unknown> = {};
    
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
      .populate('requestedBy', 'name email rating avatar')
      .populate('acceptedBy', 'name email rating avatar')
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

// Complete errand with verification
export const completeErrandWithVerification = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { image, message } = req.body;
    
    if (!image || !message) {
      return res.status(400).json({ error: 'Image and message are required for completion verification' });
    }

    const errand = await Errand.findById(id);
    if (!errand) {
      return res.status(404).json({ error: 'Errand not found' });
    }

    // Only the person who accepted the errand can complete it
    if (!errand.acceptedBy || errand.acceptedBy.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      return res.status(403).json({ error: 'Not authorized to complete this errand' });
    }

    if (errand.status !== 'in_progress') {
      return res.status(400).json({ error: 'Errand must be in progress to complete' });
    }

    // Add completion verification
    errand.completionVerification = {
      image,
      message: message.trim(),
      submittedAt: new Date()
    };
    errand.status = 'completed';
    
    await errand.save();
    await errand.populate('requestedBy', 'name email rating avatar');
    await errand.populate('acceptedBy', 'name email rating avatar');

    // 의뢰자에게 완료 알림 생성
    await createNotification(
      errand.requestedBy._id as mongoose.Types.ObjectId,
      '심부름이 완료되었습니다',
      `"${errand.title}" 심부름이 완료되었습니다. 완료 인증을 확인해주세요.`,
      'errand_completed',
      errand._id as mongoose.Types.ObjectId
    );

    res.json({
      success: true,
      errand
    });
  } catch (error) {
    console.error('Complete errand with verification error:', error);
    res.status(500).json({ error: 'Server error while completing errand' });
  }
};

// Report dispute for completed errand
export const reportDispute = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { reason, description } = req.body;
    
    if (!reason || !description) {
      return res.status(400).json({ error: 'Reason and description are required for dispute' });
    }

    const errand = await Errand.findById(id);
    if (!errand) {
      return res.status(404).json({ error: 'Errand not found' });
    }

    // Only the requester can report a dispute
    if (errand.requestedBy.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      return res.status(403).json({ error: 'Only the errand requester can report disputes' });
    }

    if (errand.status !== 'completed') {
      return res.status(400).json({ error: 'Can only dispute completed errands' });
    }

    if (errand.dispute) {
      return res.status(400).json({ error: 'Dispute already exists for this errand' });
    }

    // Add dispute
    errand.dispute = {
      reportedBy: user._id as mongoose.Types.ObjectId,
      reason,
      description: description.trim(),
      status: 'pending',
      submittedAt: new Date()
    };
    errand.status = 'disputed';
    
    await errand.save();
    await errand.populate('requestedBy', 'name email rating avatar');
    await errand.populate('acceptedBy', 'name email rating avatar');
    await errand.populate('dispute.reportedBy', 'name email avatar');

    // 수행자에게 이의제기 알림 생성
    if (errand.acceptedBy) {
      await createNotification(
        errand.acceptedBy._id as mongoose.Types.ObjectId,
        '이의제기가 접수되었습니다',
        `"${errand.title}" 심부름에 대해 이의제기가 접수되었습니다. 검토 중입니다.`,
        'errand_disputed',
        errand._id as mongoose.Types.ObjectId
      );
    }

    res.json({
      success: true,
      errand
    });
  } catch (error) {
    console.error('Report dispute error:', error);
    res.status(500).json({ error: 'Server error while reporting dispute' });
  }
};

// Get errand details including completion verification
export const getErrandWithVerification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const errand = await Errand.findById(id)
      .populate('requestedBy', 'name email rating totalErrands avatar')
      .populate('acceptedBy', 'name email rating totalErrands avatar')
      .populate('dispute.reportedBy', 'name email avatar');
    
    if (!errand) {
      return res.status(404).json({ error: 'Errand not found' });
    }

    res.json({
      success: true,
      errand
    });
  } catch (error) {
    console.error('Get errand with verification error:', error);
    res.status(500).json({ error: 'Server error while fetching errand' });
  }
};

// Check if user has active errand
export const checkActiveErrand = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const activeErrand = await Errand.findOne({
      acceptedBy: user._id,
      status: { $in: ['accepted', 'in_progress'] }
    }).populate('requestedBy', 'name email');

    res.json({
      success: true,
      hasActiveErrand: !!activeErrand,
      activeErrand: activeErrand ? {
        id: activeErrand._id,
        title: activeErrand.title,
        status: activeErrand.status,
        requestedBy: activeErrand.requestedBy
      } : null
    });
  } catch (error) {
    console.error('Check active errand error:', error);
    res.status(500).json({ error: 'Server error while checking active errand' });
  }
};

// Debug API to check all errands in database
export const debugAllErrands = async (req: Request, res: Response) => {
  try {
    const errands = await Errand.find({})
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: errands.length,
      errands
    });
  } catch (error) {
    console.error('Debug errands error:', error);
    res.status(500).json({ error: 'Server error while fetching errands' });
  }
};