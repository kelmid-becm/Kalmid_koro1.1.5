import { db } from './db';
import { BusFeedback, TripReliability } from '../types';

export const processFeedback = async (feedback: BusFeedback) => {
    await db.busFeedback.add(feedback);
    
    // Update reliability score
    const tripId = `${feedback.routeId}-${feedback.tripTime}`;
    let reliability = await db.tripReliability.get(tripId);
    
    if (!reliability) {
        reliability = {
            id: tripId,
            routeId: feedback.routeId,
            tripTime: feedback.tripTime,
            totalReports: 0,
            lateReports: 0,
            neverReports: 0,
            reliabilityScore: 1.0
        };
    }
    
    reliability.totalReports++;
    if (feedback.reportType === 'LATE') reliability.lateReports++;
    else reliability.neverReports++;
    
    // Simple reliability formula: (total - never - 0.5*late) / total
    reliability.reliabilityScore = Math.max(0, (reliability.totalReports - reliability.neverReports - (reliability.lateReports * 0.5)) / reliability.totalReports);
    
    await db.tripReliability.put(reliability);
};

export const getPrediction = async (routeId: string, tripTime: string) => {
    const tripId = `${routeId}-${tripTime}`;
    const reliability = await db.tripReliability.get(tripId);
    
    if (!reliability) return { status: 'onTime' };

    if (reliability.reliabilityScore < 0.4) {
        return { status: 'cancelled', message: 'Trip may be cancelled' };
    }
    
    if (reliability.reliabilityScore < 0.7) {
        return { status: 'delayed', message: 'Potential delay' };
    }
    
    return { status: 'onTime' };
};
