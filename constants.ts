
import { WorksheetAnalysis, ItemType } from "./types";

/**
 * Optimized Cloudinary URLs:
 * f_auto: Automatically choose the best format
 * q_auto: Automatically optimize quality
 * pg_1: Render the first page of a PDF as a thumbnail (JPG)
 * fl_attachment: Forces the browser to download the file instead of opening it
 */
export const ASSETS = {
  VIDEO_INTRO: `https://res.cloudinary.com/dginphpy4/video/upload/f_auto,q_auto/chekki-intro_y7hj7c.mp4`,      
  LOGO: `https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto/v1765769939/chekki-logo_q5xeux.png`,              
  MASCOT_HAPPY: `https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto/v1765769939/chekki-logo_q5xeux.png`,     
  MASCOT_THINKING: `https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto/v1765769939/chekki-logo_q5xeux.png`,
  MASCOT_SCAN: `https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto/v1765769939/chekki-logo_q5xeux.png`,
  HERO_IMAGE: `https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto,e_background_removal/v1765770525/Chekki_Futuristic_Background_i8foqe.png`,
  HERO_SLEEPY: `https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto/v1766246089/Sleepy-Chekki_xvg2n6.svg`,
  VIDEO_ANALYZING: `https://res.cloudinary.com/dginphpy4/video/upload/f_auto,q_auto/76_ci2vo2.mp4`,
  VIDEO_SLEEPY: `https://res.cloudinary.com/dginphpy4/video/upload/f_auto,q_auto/Sleepy_Chekki_Night_Float_fcqkyh.mp4`,
  STAMP_SOUND: `https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3`,
  
  // NEW WALKTHROUGH VIDEO (Optimized to mp4)
  VIDEO_WALKTHROUGH: `https://res.cloudinary.com/dginphpy4/video/upload/f_auto,q_auto/v1769504113/Chekki_AI_V0_fkdlyx.mp4`,

  // MARKETING ASSETS (Updated with your Poster IDs)
  // Thumbnails (PDF converted to JPG on the fly for UI display)
  FLYER_KR_THUMB: `https://res.cloudinary.com/dginphpy4/image/upload/w_600,h_800,c_fill,pg_1,f_auto,q_auto/Chekki_Korean_Poster_z2ylof.jpg`,
  FLYER_EN_THUMB: `https://res.cloudinary.com/dginphpy4/image/upload/w_600,h_800,c_fill,pg_1,f_auto,q_auto/Chekki_English_Poster_r2x0au.jpg`,
  
  // Shared PDF Links (Direct Public URLs for sharing)
  PDF_KR_SHARE: `https://res.cloudinary.com/dginphpy4/image/upload/Chekki_Korean_Poster_z2ylof.pdf`,
  PDF_EN_SHARE: `https://res.cloudinary.com/dginphpy4/image/upload/Chekki_English_Poster_r2x0au.pdf`,
  
  // Download Links (Triggers "Save As")
  PDF_KR_DOWNLOAD: `https://res.cloudinary.com/dginphpy4/image/upload/fl_attachment/Chekki_Korean_Poster_z2ylof.pdf`,
  PDF_EN_DOWNLOAD: `https://res.cloudinary.com/dginphpy4/image/upload/fl_attachment/Chekki_English_Poster_r2x0au.pdf`
};
