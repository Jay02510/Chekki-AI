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
  HERO_IMAGE: `https://res.cloudinary.com/dginphpy4/image/upload/v1771383933/Chekki_Futuristic_Background_i8foqe_e_background_removal_e_dropshadow_azimuth_220_elevation_60_spread_20_f_png_e_improve_e_sharpen_db97d3.png`,
  HERO_SLEEPY: `https://res.cloudinary.com/dginphpy4/image/upload/f_auto,q_auto/v1766246089/Sleepy-Chekki_xvg2n6.svg`,
  
  // PRIMARY LOADING ANIMATION (Updated with new High-Fidelity Screen)
  VIDEO_ANALYZING: `https://res.cloudinary.com/dginphpy4/video/upload/f_auto,q_auto/Chekki_Loading_Screen_x7fdky.mp4`,
  VIDEO_SLEEPY: `https://res.cloudinary.com/dginphpy4/video/upload/f_auto,q_auto/Sleepy_Chekki_Night_Float_fcqkyh.mp4`,
  
  // NEW STAMP SOUND (More tactile "thud" for sticker satisfaction)
  STAMP_SOUND: `https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3`,
  
  // NEW WALKTHROUGH VIDEO (Optimized to mp4)
  VIDEO_WALKTHROUGH: `https://res.cloudinary.com/dginphpy4/video/upload/f_auto,q_auto/v1769504113/Chekki_AI_V0_fkdlyx.mp4`,

  // MARKETING ASSETS (Updated with single combined flyer)
  FLYER_THUMB: `https://res.cloudinary.com/dginphpy4/image/upload/w_800,h_1100,c_fill,pg_1,f_auto,q_auto/Chekki_Flyer_nvsnta.jpg`,
  PDF_SHARE: `https://res.cloudinary.com/dginphpy4/image/upload/Chekki_Flyer_nvsnta.pdf`,
  PDF_DOWNLOAD: `https://res.cloudinary.com/dginphpy4/image/upload/fl_attachment/Chekki_Flyer_nvsnta.pdf`
};