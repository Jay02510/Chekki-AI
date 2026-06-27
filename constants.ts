import { WorksheetAnalysis, ItemType } from './types';

/**
 * Optimized Cloudinary URLs:
 * f_auto: Automatically choose the best format
 * q_auto: Automatically optimize quality
 * pg_1: Render the first page of a PDF as a thumbnail (JPG)
 * fl_attachment: Forces the browser to download the file instead of opening it
 */
export const ASSETS = {
  // Switched back to local path for consistency with current frontend assets
  VIDEO_INTRO: `https://res.cloudinary.com/dginphpy4/video/upload/v1/chekki-intro_y7hj7c.mp4`,
  LOGO: '/chekki-logo.png',
  MASCOT_HAPPY: '/chekki-happy.png',
  MASCOT_THINKING: '/chekki-thinking.png',
  MASCOT_SCAN: '/chekki-actual.png',

  HERO_IMAGE: `https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto,e_background_removal/v1765770525/Chekki_Futuristic_Background_i8foqe.png`,
  HERO_SLEEPY: `https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto/v1766246089/Sleepy-Chekki_xvg2n6.svg`,

  // PRIMARY LOADING ANIMATION (Local path recommended for smoothness)
  VIDEO_ANALYZING: `https://res.cloudinary.com/dginphpy4/video/upload/v1/Chekki_Loading_Screen_x7fdky.mp4`,
  VIDEO_SLEEPY: `https://res.cloudinary.com/dginphpy4/video/upload/v1/Sleepy_Chekki_Night_Float_fcqkyh.mp4`,

  STAMP_SOUND: `https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3`,

  // NEW WALKTHROUGH VIDEO (Optimized to mp4)
  VIDEO_WALKTHROUGH: `https://res.cloudinary.com/dginphpy4/video/upload/v1769504113/Chekki_AI_V1_1_3.mp4`,

  // MARKETING ASSETS (Updated with single combined flyer)
  FLYER_THUMB: `https://res.cloudinary.com/dginphpy4/image/upload/w_800,h_1100,c_fill,pg_1,f_auto,q_auto/Chekki_Flyer_nvsnta.jpg`,
  PDF_SHARE: `https://res.cloudinary.com/dginphpy4/image/upload/Chekki_Flyer_nvsnta.pdf`,
  PDF_DOWNLOAD: `https://res.cloudinary.com/dginphpy4/image/upload/fl_attachment/Chekki_Flyer_nvsnta.pdf`,
};
