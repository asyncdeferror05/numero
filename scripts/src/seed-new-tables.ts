import { db } from "@workspace/db";
import {
  numberMeaningsTable, professionMappingsTable, healthMappingsTable,
  relationshipMappingsTable, remediesTable, ruleTagsTable, ruleCategoriesTable,
} from "@workspace/db";

async function main() {
  console.log("Seeding new tables…");

  // ─── Personality Numbers 1-9 ────────────────────────────────────────────────
  const personalities = [
    { number: 1, title: "The Leader", description: "Independent, ambitious, pioneering. Born leaders who forge their own path.", keywords_json: ["leadership", "independence", "ambition", "originality", "courage"], strengths_json: ["Natural born leader", "Highly self-motivated", "Creative and original", "Strong willpower", "Pioneering spirit"], weaknesses_json: ["Can be domineering", "Struggles with teamwork", "Impatient with others", "Prone to arrogance", "Can be stubborn"], recommendations_json: ["Cultivate empathy for others", "Practice delegation", "Channel ambition constructively", "Develop patience"] },
    { number: 2, title: "The Diplomat", description: "Sensitive, cooperative, harmony-seeking. Natural peacemakers and advisors.", keywords_json: ["harmony", "diplomacy", "sensitivity", "cooperation", "intuition"], strengths_json: ["Exceptional mediator", "Highly empathetic", "Detail-oriented", "Patient and tactful", "Strong intuition"], weaknesses_json: ["Over-sensitive", "Indecisive", "Prone to people-pleasing", "Can be passive-aggressive", "Fear of conflict"], recommendations_json: ["Build healthy boundaries", "Trust your intuition", "Practice assertiveness", "Value your own needs"] },
    { number: 3, title: "The Communicator", description: "Creative, expressive, social. Gifted in communication, arts, and entertainment.", keywords_json: ["creativity", "expression", "joy", "communication", "optimism"], strengths_json: ["Natural communicator", "Creative and artistic", "Optimistic and joyful", "Socially magnetic", "Inspiring to others"], weaknesses_json: ["Scattered energy", "Superficial tendencies", "Prone to gossip", "Difficulty with discipline", "Mood swings"], recommendations_json: ["Focus your creative energy", "Develop emotional depth", "Practice consistency", "Avoid scattering efforts"] },
    { number: 4, title: "The Builder", description: "Disciplined, systematic, hardworking. Practical builders of lasting foundations.", keywords_json: ["stability", "discipline", "hard work", "practicality", "order"], strengths_json: ["Highly reliable", "Systematic thinker", "Excellent organizer", "Patient and persistent", "Strong sense of duty"], weaknesses_json: ["Rigid thinking", "Workaholic tendencies", "Resistant to change", "Can be blunt", "Overly conservative"], recommendations_json: ["Embrace flexibility", "Balance work with play", "Open to new perspectives", "Practice self-care"] },
    { number: 5, title: "The Freedom Seeker", description: "Versatile, adventurous, change-loving. Thrives on variety, travel, and new experiences.", keywords_json: ["freedom", "adventure", "versatility", "change", "resourcefulness"], strengths_json: ["Highly adaptable", "Quick learner", "Excellent communicator", "Charismatic", "Resourceful in crises"], weaknesses_json: ["Restless and impulsive", "Difficulty committing", "Scattered focus", "Risk-taking", "Sensory overindulgence"], recommendations_json: ["Channel energy constructively", "Develop commitment", "Practice moderation", "Complete what you start"] },
    { number: 6, title: "The Nurturer", description: "Responsible, caring, family-oriented. Natural healers and service providers.", keywords_json: ["nurturing", "responsibility", "harmony", "healing", "service"], strengths_json: ["Deeply compassionate", "Excellent caregiver", "Strong sense of justice", "Creative problem-solver", "Loyal and devoted"], weaknesses_json: ["Perfectionist tendencies", "Self-sacrificing", "Prone to worry", "Can be controlling", "Difficulty accepting help"], recommendations_json: ["Set healthy boundaries", "Prioritize self-care", "Release need for perfection", "Accept support from others"] },
    { number: 7, title: "The Seeker", description: "Analytical, introspective, spiritual. Deep thinkers who pursue wisdom and truth.", keywords_json: ["wisdom", "analysis", "spirituality", "introspection", "truth"], strengths_json: ["Deep analytical mind", "Natural researcher", "Highly intuitive", "Philosophical thinker", "Excellent investigator"], weaknesses_json: ["Can be secretive", "Socially withdrawn", "Overly skeptical", "Prone to isolation", "Cold or detached"], recommendations_json: ["Balance solitude with connection", "Share your wisdom", "Trust your intuition", "Open to spiritual experiences"] },
    { number: 8, title: "The Executive", description: "Ambitious, powerful, business-minded. Natural executives with a drive for success.", keywords_json: ["power", "success", "material mastery", "authority", "ambition"], strengths_json: ["Natural executive ability", "Excellent financial acumen", "Strong leadership", "Goal-oriented", "Highly organized"], weaknesses_json: ["Can be ruthless", "Workaholic", "Status-conscious", "Can be domineering", "Material obsession"], recommendations_json: ["Balance power with compassion", "Give back to others", "Develop spiritual values", "Avoid workaholism"] },
    { number: 9, title: "The Humanitarian", description: "Compassionate, universal, selfless. Old souls dedicated to service of humanity.", keywords_json: ["compassion", "humanitarianism", "wisdom", "generosity", "idealism"], strengths_json: ["Deeply compassionate", "Universal perspective", "Artistic and creative", "Natural healer", "Inspiring to others"], weaknesses_json: ["Can be impractical", "Difficulty with boundaries", "Prone to martyrdom", "Idealistic to a fault", "Difficulty letting go"], recommendations_json: ["Practice healthy detachment", "Balance idealism with realism", "Learn to receive", "Ground spiritual values"] },
  ];

  for (const p of personalities) {
    await db.insert(numberMeaningsTable).values({ ...p, number_type: "personality", keywords_json: p.keywords_json, strengths_json: p.strengths_json, weaknesses_json: p.weaknesses_json, recommendations_json: p.recommendations_json }).onConflictDoNothing();
  }
  console.log("✓ Personality meanings seeded");

  // ─── Birthday Numbers 1-31 ──────────────────────────────────────────────────
  const birthdayTitles: Record<number, { title: string; description: string; keywords: string[] }> = {
    1: { title: "The Pioneer", description: "Born on the 1st brings leadership and originality. You are pioneering and independent.", keywords: ["leadership", "originality", "independence"] },
    2: { title: "The Mediator", description: "Born on the 2nd brings sensitivity and diplomacy. You are gifted in partnerships.", keywords: ["sensitivity", "partnerships", "cooperation"] },
    3: { title: "The Creative", description: "Born on the 3rd brings creative self-expression and social charm.", keywords: ["creativity", "expression", "sociability"] },
    4: { title: "The Organizer", description: "Born on the 4th brings practicality and systematic thinking.", keywords: ["practicality", "organization", "stability"] },
    5: { title: "The Adventurer", description: "Born on the 5th brings versatility and a love of freedom.", keywords: ["freedom", "adventure", "versatility"] },
    6: { title: "The Caregiver", description: "Born on the 6th brings nurturing instincts and a sense of responsibility.", keywords: ["nurturing", "responsibility", "care"] },
    7: { title: "The Analyst", description: "Born on the 7th brings deep analytical powers and spiritual insight.", keywords: ["analysis", "wisdom", "spirituality"] },
    8: { title: "The Achiever", description: "Born on the 8th brings executive ability and strong ambition.", keywords: ["achievement", "authority", "power"] },
    9: { title: "The Philanthropist", description: "Born on the 9th brings humanitarian instincts and universal compassion.", keywords: ["compassion", "service", "humanitarianism"] },
    10: { title: "The Initiator", description: "Born on the 10th (1+0=1) amplifies leadership with wholeness.", keywords: ["leadership", "completeness", "initiative"] },
    11: { title: "The Illuminator", description: "Born on the 11th — a Master Number. Heightened intuition and spiritual vision.", keywords: ["intuition", "inspiration", "spiritual leadership"] },
    12: { title: "The Team Creator", description: "Born on the 12th (1+2=3) blends leadership with creative expression.", keywords: ["creativity", "teamwork", "expression"] },
    13: { title: "The Transformer", description: "Born on the 13th (1+3=4) is a karmic number of transformation through hard work.", keywords: ["transformation", "discipline", "rebirth"] },
    14: { title: "The Liberator", description: "Born on the 14th (1+4=5) — karmic freedom seeker overcoming attachments.", keywords: ["freedom", "karma", "self-mastery"] },
    15: { title: "The Magnetic", description: "Born on the 15th (1+5=6) brings magnetic charm and family devotion.", keywords: ["magnetism", "family", "attraction"] },
    16: { title: "The Spiritual Warrior", description: "Born on the 16th (1+6=7) — karmic number of spiritual awakening.", keywords: ["spirituality", "karmic lessons", "inner wisdom"] },
    17: { title: "The Star", description: "Born on the 17th (1+7=8) blends ambition with spiritual wisdom.", keywords: ["ambition", "stardom", "spiritual power"] },
    18: { title: "The Humanitarian Leader", description: "Born on the 18th (1+8=9) blends ambition with humanitarian drive.", keywords: ["leadership", "humanitarianism", "service"] },
    19: { title: "The Independent", description: "Born on the 19th (1+9=10=1) — karmic self-reliance and independence.", keywords: ["independence", "self-reliance", "karma"] },
    20: { title: "The Sensitive Soul", description: "Born on the 20th (2+0=2) deepens sensitivity and intuition.", keywords: ["sensitivity", "intuition", "diplomacy"] },
    21: { title: "The Communicative Leader", description: "Born on the 21st (2+1=3) blends communication with original ideas.", keywords: ["communication", "leadership", "creativity"] },
    22: { title: "The Master Builder", description: "Born on the 22nd — a Master Number. The most powerful builder in numerology.", keywords: ["master builder", "large-scale vision", "practical idealism"] },
    23: { title: "The Royal Star", description: "Born on the 23rd (2+3=5) — one of the most fortunate birth dates.", keywords: ["fortune", "versatility", "royal energy"] },
    24: { title: "The Balanced Helper", description: "Born on the 24th (2+4=6) brings love, balance, and home life.", keywords: ["balance", "love", "domestic harmony"] },
    25: { title: "The Spiritual Detective", description: "Born on the 25th (2+5=7) blends psychic sensitivity with analytical powers.", keywords: ["psychic ability", "analysis", "intuition"] },
    26: { title: "The Business Nurturer", description: "Born on the 26th (2+6=8) blends business acumen with nurturing.", keywords: ["business", "nurturing", "authority"] },
    27: { title: "The Healer-Artist", description: "Born on the 27th (2+7=9) is a powerful healer and creative soul.", keywords: ["healing", "creativity", "universal love"] },
    28: { title: "The Independent Humanitarian", description: "Born on the 28th (2+8=10=1) blends independence with compassion.", keywords: ["independence", "humanitarian", "leadership"] },
    29: { title: "The Moon Child", description: "Born on the 29th (2+9=11) activates the Master Number 11 energies.", keywords: ["intuition", "emotional depth", "spiritual insight"] },
    30: { title: "The Expressive Creator", description: "Born on the 30th (3+0=3) amplifies creative expression and joy.", keywords: ["creativity", "expression", "joy"] },
    31: { title: "The Disciplined Creator", description: "Born on the 31st (3+1=4) blends creative expression with practical discipline.", keywords: ["discipline", "creativity", "practicality"] },
  };

  for (const [numStr, data] of Object.entries(birthdayTitles)) {
    const num = Number(numStr);
    await db.insert(numberMeaningsTable).values({
      number: num, number_type: "birthday",
      title: data.title, description: data.description,
      keywords_json: data.keywords, strengths_json: [], weaknesses_json: [], recommendations_json: [],
    }).onConflictDoNothing();
  }
  console.log("✓ Birthday meanings seeded");

  // ─── Personal Year Numbers 1-9 ──────────────────────────────────────────────
  const personalYears = [
    { number: 1, title: "Year of New Beginnings", description: "A year to plant seeds, start fresh, and initiate bold new ventures. Best for new projects, career changes, and personal reinvention.", keywords_json: ["new beginnings", "initiative", "independence", "fresh start"], strengths_json: ["Excellent for starting new projects", "High energy and drive", "Clear direction emerges"], weaknesses_json: ["Impatience", "Can feel overwhelming"], recommendations_json: ["Launch new ventures", "Make bold decisions", "Trust your instincts"] },
    { number: 2, title: "Year of Partnerships", description: "A year for developing relationships, cultivating patience, and working cooperatively. Focus on partnerships and diplomacy.", keywords_json: ["partnerships", "patience", "cooperation", "diplomacy"], strengths_json: ["Relationships flourish", "Intuition heightened", "Teamwork excels"], weaknesses_json: ["Slow progress", "Over-sensitivity"], recommendations_json: ["Nurture relationships", "Practice patience", "Trust the process"] },
    { number: 3, title: "Year of Creativity & Expression", description: "A joyful, social, and creative year. Express yourself, expand social circles, and embrace artistic endeavors.", keywords_json: ["creativity", "self-expression", "social expansion", "joy"], strengths_json: ["Creative projects flourish", "Social life expands", "Optimism high"], weaknesses_json: ["Scattered energy", "Superficiality"], recommendations_json: ["Express yourself creatively", "Expand social circles", "Enjoy life"] },
    { number: 4, title: "Year of Foundation Building", description: "A year to build solid foundations, work hard, and establish order. Focus on security, health, and long-term planning.", keywords_json: ["hard work", "foundations", "stability", "organization"], strengths_json: ["Solid progress", "Lasting achievements", "Health improves with effort"], weaknesses_json: ["Heavy workload", "Limited fun"], recommendations_json: ["Create systems", "Focus on health", "Build for the future"] },
    { number: 5, title: "Year of Freedom & Change", description: "An exciting year of change, travel, and new experiences. Expect the unexpected and embrace transformation.", keywords_json: ["freedom", "change", "adventure", "transformation"], strengths_json: ["Exciting opportunities", "Travel favored", "Adaptability rewarded"], weaknesses_json: ["Instability", "Impulsive decisions"], recommendations_json: ["Embrace change", "Travel if possible", "Avoid reckless risks"] },
    { number: 6, title: "Year of Responsibility & Love", description: "A year focused on home, family, relationships, and responsibilities. Love and service are highlighted.", keywords_json: ["responsibility", "family", "love", "service"], strengths_json: ["Relationships deepen", "Home improvements", "Creative projects flourish"], weaknesses_json: ["Heavy responsibilities", "Others depend on you"], recommendations_json: ["Focus on family", "Beautify your home", "Serve others"] },
    { number: 7, title: "Year of Inner Reflection", description: "A year for introspection, spiritual growth, and inner wisdom. Step back from the material world and go within.", keywords_json: ["introspection", "spirituality", "wisdom", "inner growth"], strengths_json: ["Spiritual growth", "Deep insights", "Excellent for study"], weaknesses_json: ["Loneliness possible", "Slow material progress"], recommendations_json: ["Meditate daily", "Study and research", "Trust your intuition"] },
    { number: 8, title: "Year of Achievement & Power", description: "A powerful year for business success, financial gains, and professional recognition. Reap what you've sown.", keywords_json: ["success", "power", "achievement", "financial gain"], strengths_json: ["Business opportunities abound", "Recognition and rewards", "Financial improvement"], weaknesses_json: ["Can be demanding", "Avoid power struggles"], recommendations_json: ["Pursue business goals", "Invest wisely", "Step into your power"] },
    { number: 9, title: "Year of Completion & Release", description: "A year of endings, completions, and release. Let go of what no longer serves you to prepare for the next cycle.", keywords_json: ["completion", "endings", "release", "wisdom"], strengths_json: ["Clarity on what to release", "Wisdom increases", "Humanitarian impulses strong"], weaknesses_json: ["Emotional endings", "Nostalgia"], recommendations_json: ["Release the old", "Forgive and let go", "Prepare for new beginnings"] },
  ];

  for (const py of personalYears) {
    await db.insert(numberMeaningsTable).values({ ...py, number_type: "personal_year" }).onConflictDoNothing();
  }
  console.log("✓ Personal year meanings seeded");

  // ─── Profession Mappings ────────────────────────────────────────────────────
  const professions: { number: number; profession: string; weight: number }[] = [
    { number: 1, profession: "Politician / Government Leader", weight: 3.0 },
    { number: 1, profession: "CEO / Entrepreneur", weight: 3.0 },
    { number: 1, profession: "Military Officer", weight: 2.5 },
    { number: 1, profession: "Inventor", weight: 2.5 },
    { number: 2, profession: "Diplomat / Ambassador", weight: 3.0 },
    { number: 2, profession: "Counselor / Therapist", weight: 3.0 },
    { number: 2, profession: "Human Resources", weight: 2.5 },
    { number: 2, profession: "Musician / Composer", weight: 2.5 },
    { number: 3, profession: "Actor / Performer", weight: 3.0 },
    { number: 3, profession: "Writer / Author", weight: 3.0 },
    { number: 3, profession: "Sales & Marketing", weight: 2.5 },
    { number: 3, profession: "Public Relations", weight: 2.5 },
    { number: 4, profession: "Engineer", weight: 3.0 },
    { number: 4, profession: "Accountant / Auditor", weight: 3.0 },
    { number: 4, profession: "Architect", weight: 2.5 },
    { number: 4, profession: "Project Manager", weight: 2.5 },
    { number: 5, profession: "Travel Agent / Tour Guide", weight: 3.0 },
    { number: 5, profession: "Journalist / Reporter", weight: 3.0 },
    { number: 5, profession: "Salesperson", weight: 2.5 },
    { number: 5, profession: "Event Planner", weight: 2.5 },
    { number: 6, profession: "Doctor / Nurse / Healer", weight: 3.0 },
    { number: 6, profession: "Teacher / Educator", weight: 3.0 },
    { number: 6, profession: "Social Worker", weight: 2.5 },
    { number: 6, profession: "Interior Designer", weight: 2.5 },
    { number: 7, profession: "Researcher / Scientist", weight: 3.0 },
    { number: 7, profession: "Spiritual Teacher / Astrologer", weight: 3.0 },
    { number: 7, profession: "Philosopher / Psychologist", weight: 2.5 },
    { number: 7, profession: "Analyst / Data Scientist", weight: 2.5 },
    { number: 8, profession: "Business Executive / Manager", weight: 3.0 },
    { number: 8, profession: "Banker / Financial Advisor", weight: 3.0 },
    { number: 8, profession: "Real Estate Developer", weight: 2.5 },
    { number: 8, profession: "Lawyer / Judge", weight: 2.5 },
    { number: 9, profession: "NGO / Non-Profit Leader", weight: 3.0 },
    { number: 9, profession: "Artist / Painter", weight: 2.5 },
    { number: 9, profession: "Spiritual Leader / Healer", weight: 2.5 },
    { number: 9, profession: "Philosopher", weight: 2.0 },
  ];

  for (const p of professions) {
    await db.insert(professionMappingsTable).values(p).onConflictDoNothing();
  }
  console.log("✓ Profession mappings seeded");

  // ─── Health Mappings ────────────────────────────────────────────────────────
  const health: { number: number; health_area: string; severity: string; notes: string }[] = [
    { number: 1, health_area: "Heart & Cardiovascular", severity: "moderate", notes: "Prone to high blood pressure. Avoid excessive stress and workaholic tendencies." },
    { number: 1, health_area: "Head / Migraines", severity: "mild", notes: "Stress-induced headaches and migraines are common." },
    { number: 2, health_area: "Nervous System", severity: "moderate", notes: "Highly sensitive nervous system. Stress causes anxiety and nervous disorders." },
    { number: 2, health_area: "Digestive Issues", severity: "mild", notes: "Emotional stress manifests as digestive problems." },
    { number: 3, health_area: "Throat & Vocal Cords", severity: "mild", notes: "Voice and throat issues when expressing emotions is blocked." },
    { number: 3, health_area: "Skin Conditions", severity: "mild", notes: "Skin reactions to emotional stress and scattered energy." },
    { number: 4, health_area: "Bones & Skeletal System", severity: "moderate", notes: "Prone to back problems, arthritis, and skeletal issues from overwork." },
    { number: 4, health_area: "Respiratory System", severity: "mild", notes: "Watch for respiratory issues due to poor posture and stress." },
    { number: 5, health_area: "Nervous System", severity: "strong", notes: "Highly prone to burnout, nervous disorders from overstimulation." },
    { number: 5, health_area: "Addiction Tendency", severity: "moderate", notes: "Susceptible to sensory overindulgence and addictive tendencies." },
    { number: 6, health_area: "Heart & Chest", severity: "mild", notes: "Emotional matters affect heart health. Watch for chest tension." },
    { number: 6, health_area: "Blood Sugar", severity: "moderate", notes: "Prone to diabetes and blood sugar issues when diet is neglected." },
    { number: 7, health_area: "Lymphatic System", severity: "moderate", notes: "Prone to lymphatic congestion and immune issues from isolation." },
    { number: 7, health_area: "Mental Health", severity: "moderate", notes: "Risk of depression and anxiety from over-isolation and suppression." },
    { number: 8, health_area: "Liver & Gallbladder", severity: "moderate", notes: "Excess stress affects liver function. Watch for gallbladder issues." },
    { number: 8, health_area: "High Blood Pressure", severity: "strong", notes: "Highly prone to hypertension from power drives and stress." },
    { number: 9, health_area: "Blood & Circulation", severity: "mild", notes: "Prone to blood disorders. Ensure regular check-ups." },
    { number: 9, health_area: "Mental/Emotional Health", severity: "moderate", notes: "Can suffer emotional burnout from giving too much to others." },
  ];

  for (const h of health) {
    await db.insert(healthMappingsTable).values(h).onConflictDoNothing();
  }
  console.log("✓ Health mappings seeded");

  // ─── Relationship Mappings ──────────────────────────────────────────────────
  const relationships: { number: number; relationship_type: string; interpretation: string }[] = [
    { number: 1, relationship_type: "marriage", interpretation: "Number 1s need a partner who respects their independence. Best paired with 3, 5, or 6. Can clash with another 1." },
    { number: 1, relationship_type: "business", interpretation: "Excellent business leaders. Work best with supportive partners who handle details while they focus on vision." },
    { number: 2, relationship_type: "marriage", interpretation: "Devoted and loyal partners who thrive in harmonious relationships. Best paired with 6, 8, or 9." },
    { number: 2, relationship_type: "friendship", interpretation: "Deeply caring and supportive friends. Create lasting, meaningful friendships." },
    { number: 3, relationship_type: "romantic", interpretation: "Fun, flirtatious, and charming. Love the excitement of romance. Best paired with 1, 5, or 9." },
    { number: 3, relationship_type: "friendship", interpretation: "The life of the party. Popular and socially magnetic, with a wide circle of friends." },
    { number: 4, relationship_type: "marriage", interpretation: "Loyal and stable partners who build secure homes. Best paired with 2, 6, or 8." },
    { number: 4, relationship_type: "business", interpretation: "The backbone of any business. Reliable, hardworking, and excellent at systems." },
    { number: 5, relationship_type: "romantic", interpretation: "Exciting, adventurous lovers who resist commitment. Need freedom in relationships. Best paired with 1, 3, or 7." },
    { number: 5, relationship_type: "family", interpretation: "Can struggle with family obligations and routine. Need understanding family members." },
    { number: 6, relationship_type: "marriage", interpretation: "The ideal partner for those seeking a loving home. Devoted, caring, and family-oriented." },
    { number: 6, relationship_type: "family", interpretation: "The anchor of the family. Takes on responsibility naturally and cares deeply for all members." },
    { number: 7, relationship_type: "marriage", interpretation: "Selective and private in relationships. Need intellectual connection. Best paired with 4 or 9." },
    { number: 7, relationship_type: "business", interpretation: "Excellent researchers and strategists. Work best independently or in small trusted teams." },
    { number: 8, relationship_type: "marriage", interpretation: "Strong and ambitious partners. Can be domineering. Need an equal partner. Best paired with 2 or 4." },
    { number: 8, relationship_type: "business", interpretation: "Natural business leaders. Excellent at financial management and building empires." },
    { number: 9, relationship_type: "romantic", interpretation: "Idealistic and giving in romance. Need a partner who appreciates their generous nature." },
    { number: 9, relationship_type: "family", interpretation: "The wise elder of the family. Everyone turns to them for guidance and wisdom." },
  ];

  for (const r of relationships) {
    await db.insert(relationshipMappingsTable).values(r).onConflictDoNothing();
  }
  console.log("✓ Relationship mappings seeded");

  // ─── Remedies ───────────────────────────────────────────────────────────────
  const remediesData = [
    { title: "Wear Ruby on Sundays", category: "spiritual", description: "Ruby gemstone strengthens Sun energy (Number 1). Wear on the ring finger of the right hand." },
    { title: "Donate blood or food on Tuesdays", category: "spiritual", description: "Strengthens Mars energy and removes obstacles for Numbers 9 and 1." },
    { title: "Plant a Tulsi (Holy Basil) plant at home", category: "health", description: "Purifies home energy and improves immunity. Beneficial for all numbers." },
    { title: "Chant the Gayatri Mantra daily", category: "spiritual", description: "108 repetitions daily improves mental clarity and removes negative karma." },
    { title: "Feed crows on Saturdays", category: "spiritual", description: "Appeases Saturn energy and removes karma blocks, especially for Numbers 8." },
    { title: "Keep a bowl of sea salt in your bedroom", category: "health", description: "Absorbs negative energy and promotes restful sleep." },
    { title: "Donate yellow items on Thursdays", category: "career", description: "Strengthens Jupiter energy, bringing luck and prosperity in career." },
    { title: "Wear green on Wednesdays", category: "finance", description: "Enhances Mercury energy for communication, intellect, and financial intelligence." },
    { title: "Meditate during sunrise daily", category: "spiritual", description: "Aligns your energy with solar forces, increasing vitality and clarity." },
    { title: "Drink water kept in a copper vessel", category: "health", description: "Improves digestive health and overall vitality according to Vedic wisdom." },
    { title: "Practice gratitude journaling nightly", category: "relationship", description: "Writing 5 gratitudes before bed transforms relationship energy and attracts abundance." },
    { title: "Wear blue sapphire after proper assessment", category: "career", description: "Saturn's stone for Number 8 individuals. Consult an expert before wearing." },
    { title: "Keep home clutter-free and well-lit", category: "finance", description: "Feng shui principle: clear spaces allow positive energy and financial prosperity to flow." },
    { title: "Light a ghee lamp on Fridays", category: "relationship", description: "Strengthens Venus energy, enhancing love, beauty, and relationships for all numbers." },
    { title: "Donate old clothes on Saturdays", category: "spiritual", description: "Releases material attachments and creates space for new blessings." },
  ];

  for (const r of remediesData) {
    await db.insert(remediesTable).values(r).onConflictDoNothing();
  }
  console.log("✓ Remedies seeded");

  // ─── Rule Tags ───────────────────────────────────────────────────────────────
  const tags = ["career", "health", "relationships", "spirituality", "finance", "personality", "karma", "family", "travel", "transformation"];
  for (const name of tags) {
    await db.insert(ruleTagsTable).values({ name }).onConflictDoNothing();
  }
  console.log("✓ Rule tags seeded");

  // ─── Rule Categories ─────────────────────────────────────────────────────────
  const categories = [
    { name: "Core Numbers", description: "Birthday, Destiny, and Personality number interpretations" },
    { name: "Yearly Forecast", description: "Personal Year, Month, and Day number rules" },
    { name: "Lo Shu Grid", description: "Missing, repeated, and arrow-based grid interpretations" },
    { name: "Relationships", description: "Compatibility and relationship-focused rules" },
    { name: "Remedies & Guidance", description: "Remedial measures and corrective guidance" },
  ];
  for (const c of categories) {
    await db.insert(ruleCategoriesTable).values(c).onConflictDoNothing();
  }
  console.log("✓ Rule categories seeded");

  console.log("\n✅ All new tables seeded successfully!");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
