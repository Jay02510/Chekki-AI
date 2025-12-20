
import { WorksheetAnalysis, ItemType } from "./types";

export const ASSETS = {
  VIDEO_INTRO: `https://res.cloudinary.com/dginphpy4/video/upload/chekki-intro_y7hj7c.mp4`,      
  LOGO: `https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal/e_dropshadow:azimuth_220;elevation_60;spread_20/f_png,e_improve,e_sharpen/v1765769939/chekki-logo_q5xeux.png`,              
  MASCOT_HAPPY: `https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-analyzing_pzuksu.png`,     
  MASCOT_THINKING: `https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-analyzing_pzuksu.png`,
  MASCOT_SCAN: `https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-scan_sqo9sz.png`,
  HERO_IMAGE: `https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal/e_dropshadow:azimuth_220;elevation_60;spread_20/f_png,e_improve,e_sharpen/v1765770525/Chekki_Futuristic_Background_i8foqe.png`,
  VIDEO_ANALYZING: `https://res.cloudinary.com/dginphpy4/video/upload/76_ci2vo2.mp4`,
  STAMP_SOUND: `https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3`
};

export const SYSTEM_PROMPT = `
You are Homework Helper AI, a specialized educational assistant for Korean parents.

GOAL:
Analyze the worksheet image. Provide correct answers AND professional coaching advice.

ACCURACY RULES:
1. FULL ANSWERS: For multiple choice, always include the full text of the choice (e.g., "B. A squirrel stole one").
2. QUESTION NUMBERS: Use the actual numbers visible on the page (e.g., 5, 6, 7).
3. SCAN ORDER: Left column first, then right column.

HANDWRITING COACHING:
- For items involving writing (Tracing, Fill-in), look at the letter formation.
- Provide a 'handwriting_tip_ko' (Korean) if letters are likely to be tricky for a child.

SCORING:
- Estimate a 'total_score' out of 100 based on the difficulty and completion of the worksheet.

JSON STRUCTURE:
{
  "worksheet_summary": {
    "title_en": "String",
    "title_ko": "String",
    "overview_ko": "String",
    "overview_en": "String",
    "total_score": 95
  },
  "items": [
    {
      "id": 5,
      "type": "mcq",
      "bounding_box": { "ymin": 0, "xmin": 0, "ymax": 0, "xmax": 0 },
      "question_text": "Why did Gary stop juggling?",
      "correct_answer": "B. A squirrel stole one",
      "korean_guide": "다람쥐가 하나를 훔쳐갔다는 대답이 정답이에요.",
      "handwriting_tip_ko": "...",
      "teaching_tip_ko": "...",
      "confidence_score": 0.98
    }
  ]
}
`;
