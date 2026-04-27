/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  GraduationCap, 
  Book, 
  FileText, 
  Dumbbell, 
  Stethoscope, 
  Coffee, 
  Utensils, 
  Heart, 
  Users, 
  Video, 
  Briefcase, 
  ShoppingCart, 
  Activity, 
  Plane, 
  Bus, 
  Home, 
  Music, 
  Clock 
} from 'lucide-react';

export const getSmartIcon = (title: string) => {
  const t = title.toLowerCase();
  
  // Academic
  if (t.includes('محاضرة') || t.includes('lecture') || t.includes('class') || t.includes('درس') || t.includes('جامعة') || t.includes('مدرسة')) return <GraduationCap className="w-4 h-4" />;
  if (t.includes('دراسة') || t.includes('study') || t.includes('مذاكرة') || t.includes('book') || t.includes('كتاب')) return <Book className="w-4 h-4" />;
  if (t.includes('امتحان') || t.includes('exam') || t.includes('quiz') || t.includes('test') || t.includes('اختبار')) return <FileText className="w-4 h-4" />;

  // Health & Sports
  if (t.includes('جيم') || t.includes('gym') || t.includes('workout') || t.includes('تمرين') || t.includes('رياضة') || t.includes('sport')) return <Dumbbell className="w-4 h-4" />;
  if (t.includes('طبيب') || t.includes('doctor') || t.includes('دكتور') || t.includes('medical') || t.includes('dentist') || t.includes('صحة') || t.includes('مستشفى')) return <Stethoscope className="w-4 h-4" />;
  
  // Social & Food
  if (t.includes('قهوة') || t.includes('coffee') || t.includes('cafe')) return <Coffee className="w-4 h-4" />;
  if (t.includes('lunch') || t.includes('dinner') || t.includes('breakfast') || t.includes('غداء') || t.includes('عشاء') || t.includes('فطور') || t.includes('أكل') || t.includes('food')) return <Utensils className="w-4 h-4" />;
  if (t.includes('عيد') || t.includes('birthday') || t.includes('حفلة') || t.includes('party')) return <Heart className="w-4 h-4" />;

  // Work & Meetings
  if (t.includes('اجتماع') || t.includes('meeting') || t.includes('call') || t.includes('اتصال') || t.includes('مقابلة')) return <Users className="w-4 h-4" />;
  if (t.includes('zoom') || t.includes('teams') || t.includes('video') || t.includes('فيديو')) return <Video className="w-4 h-4" />;
  if (t.includes('عمل') || t.includes('work') || t.includes('وظيفة') || t.includes('office') || t.includes('مكتب')) return <Briefcase className="w-4 h-4" />;
  
  // Shopping & Finance
  if (t.includes('تسوق') || t.includes('shop') || t.includes('شراء')) return <ShoppingCart className="w-4 h-4" />;
  if (t.includes('بنك') || t.includes('bank') || t.includes('فلوس') || t.includes('money') || t.includes('finance') || t.includes('دفع') || t.includes('pay')) return <Activity className="w-4 h-4" />;

  // Transport & Home
  if (t.includes('سفر') || t.includes('travel') || t.includes('plane') || t.includes('طيران')) return <Plane className="w-4 h-4" />;
  if (t.includes('حافلة') || t.includes('bus') || t.includes('طريق') || t.includes('trip')) return <Bus className="w-4 h-4" />;
  if (t.includes('بيت') || t.includes('home') || t.includes('منزل') || t.includes('عائلة')) return <Home className="w-4 h-4" />;
  
  if (t.includes('music') || t.includes('أغاني') || t.includes('موسيقى')) return <Music className="w-4 h-4" />;

  return <Clock className="w-4 h-4" />;
};
