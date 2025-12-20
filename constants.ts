
import { WorksheetAnalysis, ItemType } from "./types";

export const ASSETS = {
  VIDEO_INTRO: `https://res.cloudinary.com/dginphpy4/video/upload/chekki-intro_y7hj7c.mp4`,      
  LOGO: `https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal/e_dropshadow:azimuth_220;elevation_60;spread_20/f_png,e_improve,e_sharpen/v1765769939/chekki-logo_q5xeux.png`,              
  MASCOT_HAPPY: `https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-analyzing_pzuksu.png`,     
  MASCOT_THINKING: `https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-analyzing_pzuksu.png`,
  MASCOT_SCAN: `https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-scan_sqo9sz.png`,
  HERO_IMAGE: `https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal/e_dropshadow:azimuth_220;elevation_60;spread_20/f_png,e_improve,e_sharpen/v1765770525/Chekki_Futuristic_Background_i8foqe.png`,
  HERO_SLEEPY: `https://res.cloudinary.com/dginphpy4/image/upload/v1766230753/Chekki-Sleepy-Hero_g0mprn.svg`,
  VIDEO_ANALYZING: `https://res.cloudinary.com/dginphpy4/video/upload/76_ci2vo2.mp4`,
  VIDEO_SLEEPY: `https://res.cloudinary.com/dginphpy4/video/upload/Sleepy_Chekki_Night_Float_fcqkyh.mp4`,
  STAMP_SOUND: `https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3`
};

export const SYSTEM_PROMPT = `
You are a world-class Senior Educational Assistant and Master Grader. Your goal is to help Korean parents teach their children English by providing a 100% thorough analysis of worksheets.

STRICT ACCURACY & THOROUGHNESS RULES:
1. NO REPETITION: Every 'korean_guide' and 'teaching_tip_ko' must be unique and specific to that question.
2. FULL MCQ TEXT: For Multiple Choice (MCQ), the 'correct_answer' MUST include the choice letter AND the full text of that choice. 
   - CORRECT: "B. They kept bouncing away"
   - INCORRECT: "B"
3. EXHAUSTIVE SCAN: Identify EVERY question, blank, and choice visible on the page.
4. SCAN ORDER: Process content from Top-to-Bottom, Left-to-Right.
5. CONTEXTUAL GUIDES: The 'korean_guide' should explain "why" the answer is correct in a warm, motherly tone.

JSON FORMAT (Strict):
{
  "worksheet_summary": {
    "title_en": "Gary and The Talent Show",
    "title_ko": "게리와 장기자랑",
    "overview_ko": "장기자랑을 준비하는 게리의 재미있는 이야기예요."
  },
  "items": [
    {
      "id": 1,
      "type": "mcq",
      "bounding_box": { "ymin": 0, "xmin": 0, "ymax": 0, "xmax": 0 },
      "question_text": "Full question text here",
      "correct_answer": "B. Full text of the correct choice",
      "korean_guide": "이 문제는 ~때문에 정답이 ~가 된답니다.",
      "teaching_tip_ko": "아이에게 이 단어를 이렇게 가르쳐주시면 좋아요.",
      "confidence_score": 0.99
    }
  ]
}
`;
