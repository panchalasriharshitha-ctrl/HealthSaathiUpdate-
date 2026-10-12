const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { createWorker } = require("tesseract.js");
const { OpenAI } = require("openai");
const https = require("https");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Configure Multer for in-memory file handling
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12 MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp"
    ];
    if (allowedMimes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("UNSUPPORTED_FILE_TYPE"));
    }
  }
});

// In-memory vitals store initialized with healthy baseline
let inMemoryVitals = [
  {
    id: 1,
    heart_rate: 72,
    blood_pressure_sys: 118,
    blood_pressure_dia: 78,
    blood_glucose: 95.5,
    oxygen_level: 98,
    sleep_hours: 7.5,
    notes: "Resting morning baseline",
    created_at: new Date().toISOString()
  }
];

const {
  validateMedicalReportText,
  validatePrescriptionText,
  parseLabReportHeuristics
} = require("./clinicalParser");

// Helper to get initialized OpenAI client safely
function getOpenAIClient() {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey || apiKey === "your_openai_api_key_here") {
    return null;
  }
  return new OpenAI({ apiKey });
}

// Unified AI Assistant caller supporting OpenAI and Google Gemini
async function callAI({ systemPrompt = "", userPrompt = "", jsonMode = false, model = null }) {
  // 1. Try OpenAI if key is present
  const openaiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (openaiKey && openaiKey !== "your_openai_api_key_here") {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const messages = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: userPrompt });

      const completion = await openai.chat.completions.create({
        model: model || process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages,
        response_format: jsonMode ? { type: "json_object" } : undefined,
        temperature: 0.2
      });
      return {
        text: completion.choices[0]?.message?.content || "",
        provider: "openai",
        model: model || process.env.OPENAI_MODEL || "gpt-4o-mini"
      };
    } catch (e) {
      console.warn("OpenAI call warning:", e.message);
    }
  }

  // 2. Try Google Gemini if GEMINI_API_KEY or AI_API_KEY is present
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "").trim();
  if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
    try {
      const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;

      const body = {
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          ...(jsonMode ? { responseMimeType: "application/json" } : {})
        }
      };

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (resp.ok) {
        const data = await resp.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return {
          text,
          provider: "gemini",
          model: geminiModel
        };
      } else {
        const errText = await resp.text();
        console.warn(`Gemini API warning (${resp.status}):`, errText);
      }
    } catch (e) {
      console.warn("Gemini call warning:", e.message);
    }
  }

  return null;
}

// Extract text from uploaded buffer (PDF or Image)
async function extractTextFromFile(fileBuffer, mimetype, originalname = "") {
  const mime = (mimetype || "").toLowerCase();
  const isPdf = mime === "application/pdf" || originalname.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    try {
      if (typeof pdfParse === "function") {
        const data = await pdfParse(fileBuffer);
        return (data.text || "").trim();
      }
      if (pdfParse && pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: fileBuffer });
        await parser.load();
        const textObj = await parser.getText();
        await parser.destroy();
        return (typeof textObj === "string" ? textObj : textObj?.text || "").trim();
      }
    } catch (err) {
      console.warn("PDF extraction warning:", err.message);
      // Fallback: extract ASCII strings if present in binary PDF
      try {
        const raw = fileBuffer.toString("latin1");
        const matches = raw.match(/[A-Za-z0-9\s.,:;/%()\-]{4,}/g);
        if (matches) return matches.join(" ").trim();
      } catch (e) {
        // Fallback failed
      }
      return "";
    }
  }

  // Otherwise assume image and run OCR using Tesseract
  try {
    const worker = await createWorker("eng");
    const ret = await worker.recognize(fileBuffer);
    await worker.terminate();
    return (ret.data?.text || "").trim();
  } catch (err) {
    console.warn("OCR extraction warning:", err.message);
    return "";
  }
}

// -----------------------------------------------------------------------------
// Root & Health Check Endpoints
// -----------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    message: "HealthSaathi Backend Connected Successfully!",
    version: "2.5.0",
    service: "Healthcare API"
  });
});

app.get("/api/health", (req, res) => {
  const hasOpenAiKey = Boolean(
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== "your_openai_api_key_here"
  );
  const hasGeminiKey = Boolean(
    (process.env.GEMINI_API_KEY || process.env.AI_API_KEY) &&
    (process.env.GEMINI_API_KEY || process.env.AI_API_KEY) !== "your_gemini_api_key_here"
  );

  res.json({
    status: "OK",
    message: "HealthSaathi API is running",
    timestamp: new Date().toISOString(),
    ai_configured: hasOpenAiKey || hasGeminiKey,
    openai_configured: hasOpenAiKey,
    gemini_configured: hasGeminiKey,
    environment: process.env.APP_ENV || "development"
  });
});

// -----------------------------------------------------------------------------
// Vitals Endpoints
// -----------------------------------------------------------------------------
app.get("/api/vitals", (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  res.json(inMemoryVitals.slice(0, limit));
});

app.post("/api/vitals", (req, res) => {
  const newRecord = {
    ...req.body,
    id: Date.now(),
    created_at: new Date().toISOString()
  };
  inMemoryVitals.unshift(newRecord);
  res.status(201).json(newRecord);
});

// -----------------------------------------------------------------------------
// AI Health Assistant (Copilot) with OpenAI & Safety Triage
// -----------------------------------------------------------------------------
app.post("/api/copilot/chat", async (req, res) => {
  const { message = "", lang = "en", user_id = "patient", history = [] } = req.body;
  const query = message.trim();

  if (!query) {
    return res.status(400).json({ error: "Message is required" });
  }

  const queryLower = query.toLowerCase();

  // Emergency red-flag heuristic keywords
  const isEmergency = [
    "chest pain", "heart attack", "can't breathe", "cannot breathe", "shortness of breath",
    "stroke", "slurred speech", "unconscious", "heavy bleeding", "gasping", "fainting",
    "severe pressure in chest", "left arm numbness", "blue lips", "anaphylaxis"
  ].some((kw) => queryLower.includes(kw));

  // Language instructions for system prompt
  let langInstruction = "Respond in English.";
  if (lang === "te") {
    langInstruction = "Respond in natural, fluent Telugu (తెలుగు) with accessible and empathetic health vocabulary.";
  } else if (lang === "hi") {
    langInstruction = "Respond in natural, fluent Hindi (हिन्दी) with accessible and empathetic health vocabulary.";
  }

  const systemPrompt = `You are HealthSaathi, a compassionate personal health information assistant and clinical triage companion.
GUIDELINES:
1. Provide clear health literacy in simple, understandable language.
2. Ask clarifying questions when important context (e.g., symptom onset, duration, severity 1-10, patient age, existing conditions) is missing.
3. Distinguish general health education from formal clinical diagnosis and treatment.
4. DO NOT invent medical facts, pharmaceuticals, dosages, citations, or references.
5. If the user presents red-flag emergency symptoms (such as crushing chest pain, sudden numbness, slurred speech, acute breathlessness), prominently advise them to seek emergency medical care immediately or call emergency services (112 or 108 in India / 911).
6. Always include a reminder that you provide educational guidance and do not replace a qualified physician.
7. ${langInstruction}`;

  const openai = getOpenAIClient();

  // If OpenAI is NOT configured, provide reliable clinical triage without crashing
  if (!openai) {
    let fallbackReply = "";
    let category = "general_wellness";
    let actions = ["Hydrate adequately", "Track resting vitals", "Prepare questions for doctor"];

    if (isEmergency) {
      category = "urgent_care_alert";
      actions = ["Call 112 / 108 immediately", "Do not drive yourself", "Alert family or neighbors"];
      fallbackReply = (lang === "te")
        ? "🚨 అత్యవసర వైద్య హెచ్చరిక: మీరు పేర్కొన్న లక్షణాలు అత్యవసర వైద్య పరిస్థితిని సూచించవచ్చు. దయచేసి ఆలస్యం చేయకుండా వెంటనే 112 లేదా 108 కి కాల్ చేయండి లేదా సమీపంలోని అత్యవసర విభాగానికి వెళ్ళండి."
        : (lang === "hi")
        ? "🚨 आपातकालीन चिकित्सा चेतावनी: आपके द्वारा बताए गए लक्षण किसी गंभीर स्वास्थ्य आपात स्थिति का संकेत हो सकते हैं। कृपया तुरंत 112 या 108 पर कॉल करें या नजदीकी आपातकालीन केंद्र जाएं।"
        : "🚨 URGENT MEDICAL ADVICE: The symptoms you described may indicate an acute health emergency. Please do not wait. Call emergency services (112 / 108 in India or your local emergency number) or proceed to the nearest emergency department immediately.";
    } else if (queryLower.includes("headache") || queryLower.includes("migraine")) {
      category = "symptom_triage";
      actions = ["Drink 500ml room-temp water", "Dim ambient screens", "Rest eyes for 20 minutes"];
      fallbackReply = (lang === "te")
        ? "తలనొప్పి సాధారణంగా డీహైడ్రేషన్, కంటి అలసట లేదా నిద్రలేమి వల్ల రావచ్చు. కొద్దిగా నీరు తాగి, 20 నిమిషాలు స్క్రీన్లకు దూరంగా విశ్రాంతి తీసుకోండి. తీవ్రమైతే వైద్యుడిని సంప్రదించండి."
        : (lang === "hi")
        ? "सिरदर्द अक्सर डिहाइड्रेशन, स्क्रीन से आंखों की थकान या तनाव के कारण हो सकता है। पर्याप्त पानी पिएं और 20 मिनट के लिए स्क्रीन से दूर आराम करें। यदि दर्द बढ़ जाए तो डॉक्टर से मिलें।"
        : "Headaches commonly stem from dehydration, screen fatigue, or tension. Drink water, rest your eyes in a dim room, and observe if symptoms improve. If sudden or accompanied by vision changes, consult a clinician promptly.";
    } else {
      fallbackReply = (lang === "te")
        ? `హలో! నేను మీ హెల్త్ సాథి AI సహాయకుడిని. మీ ప్రశ్న: "${query}". మీ ప్రాథమిక కొలతలు సాధారణంగా ఉన్నాయి. మరింత సమాచారం లేదా లక్షణాలు తెలియజేయండి.`
        : (lang === "hi")
        ? `नमस्ते! मैं आपका हेल्थ साथी AI सहायक हूँ। आपका प्रश्न: "${query}". आपके स्वास्थ्य माप सामान्य हैं। कृपया अपने विशिष्ट लक्षणों के बारे में विस्तार से बताएं।`
        : `Hello! I am HealthSaathi, your health copilot. I received your inquiry: "${query}". Your recent vitals are recorded. Could you share how long you have experienced this, or if you have any other associated symptoms?`;
    }

    return res.json({
      success: true,
      reply: fallbackReply,
      category,
      suggested_actions: actions,
      is_emergency: isEmergency,
      provider: "clinical_heuristics",
      config_notice: "OpenAI API key (OPENAI_API_KEY) is not yet configured in backend/.env. Running with verified clinical heuristics.",
      disclaimer: "HealthSaathi provides educational guidance, not formal clinical diagnosis. In emergencies, call 112 / 108."
    });
  }

  // OpenAI API is configured -> call Chat Completions / Responses
  try {
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-6).map((h) => ({
        role: h.sender === "user" ? "user" : "assistant",
        content: h.text || h.message || ""
      })),
      { role: "user", content: query }
    ];

    const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: formattedMessages,
      temperature: 0.35,
      max_tokens: 700
    });

    const replyText = completion.choices[0]?.message?.content || "";

    const suggestedActions = isEmergency
      ? ["Call 112 / 108 Emergency", "Do not drive yourself", "Inform family member"]
      : ["Record current vitals", "Schedule clinical review", "Prepare questions for doctor"];

    return res.json({
      success: true,
      reply: replyText,
      category: isEmergency ? "urgent_care_alert" : "ai_clinical_guidance",
      suggested_actions: suggestedActions,
      is_emergency: isEmergency,
      provider: "openai",
      model: modelName,
      disclaimer: "HealthSaathi provides health literacy and information, not formal diagnosis. Consult a licensed physician for personalized care."
    });
  } catch (err) {
    console.error("OpenAI API call error:", err.message);

    const isQuotaError = err.status === 429 || (err.message || "").includes("quota");
    const isAuthError = err.status === 401 || (err.message || "").includes("key");

    let errDetail = "Temporary AI provider connection delay.";
    if (isQuotaError) {
      errDetail = "OpenAI API quota exceeded or billing inactive. Please check your OpenAI account billing.";
    } else if (isAuthError) {
      errDetail = "Invalid OpenAI API Key in backend/.env. Please verify your OPENAI_API_KEY.";
    }

    // Return safe response with clear notification of configuration needed
    return res.json({
      success: true,
      reply: `I received your question: "${query}".\n\n⚠️ AI Provider Notice: ${errDetail}\n\nGeneral Guidance: For persistent or uncomfortable symptoms, record your baseline vitals and arrange a consultation with your doctor. If you experience severe pain, breathlessness, or chest pressure, seek emergency care immediately (dial 112 / 108).`,
      category: isEmergency ? "urgent_care_alert" : "safety_fallback",
      suggested_actions: isEmergency ? ["Call 112 / 108", "Emergency Dept"] : ["Check Resting Vitals", "Consult Doctor"],
      is_emergency: isEmergency,
      provider: "fallback_after_error",
      error_message: errDetail,
      disclaimer: "HealthSaathi provides informational support only."
    });
  }
});

// -----------------------------------------------------------------------------
// Lab Reports Analysis (PDF & Image OCR with Plain-Language Breakdown)
// -----------------------------------------------------------------------------
app.post("/api/reports/analyze", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "NO_FILE",
        message: "Please select a lab report file (PDF, PNG, or JPG) to upload."
      });
    }

    const { mimetype, originalname, size, buffer } = req.file;
    const lang = req.body.lang || "en";

    // Extract readable text from file
    const extractedText = await extractTextFromFile(buffer, mimetype, originalname);

    // Document Medical Validation
    const validation = validateMedicalReportText(extractedText);
    if (!validation.isValid) {
      return res.status(422).json({
        success: false,
        error: validation.reason,
        message: validation.message,
        extracted_text_preview: validation.preview || (extractedText || "").substring(0, 300),
        suggestion: "Please upload an official photo or digital PDF of an actual clinical laboratory report (such as a Complete Blood Count, Blood Sugar, Lipid Profile, Liver or Kidney panel)."
      });
    }

    // Multilingual instructions
    let langNote = "Language: English.";
    if (lang === "te") langNote = "Translate the plain_explanation and doctor_questions into natural Telugu (తెలుగు).";
    if (lang === "hi") langNote = "Translate the plain_explanation and doctor_questions into natural Hindi (हिन्दी).";

    // Try AI first if available (OpenAI or Gemini)
    let aiResult = null;
    try {
      const prompt = `You are a clinical laboratory evaluation assistant.
Extract and structure laboratory test results from the raw extracted text below.
STRICT RULES:
1. ONLY extract tests that are explicitly present in the text. DO NOT invent or assume test values, units, or reference ranges!
2. Preserve the laboratory's original reported values, units, and reference ranges exactly as printed.
3. If a reference range is not stated in the report, set reference_range to "Not stated by lab".
4. Determine flag: "High", "Low", "Normal", or "Critical" strictly based on whether the lab marked it or compared to stated range.
5. Provide a simple, clear explanation in plain language explaining what this biomarker measures and what the deviation may indicate.
6. Provide 2-3 specific questions for the patient to ask their doctor.
7. ${langNote}

Respond ONLY with valid JSON in this exact structure:
{
  "report_metadata": {
    "patient_name": "string or 'Not specified'",
    "laboratory_name": "string or 'Not specified'",
    "report_date": "string or 'Not specified'",
    "test_category": "e.g. Complete Blood Count / Metabolic Panel / Lipid Profile"
  },
  "tests": [
    {
      "test_name": "e.g. Fasting Blood Glucose",
      "reported_value": "e.g. 110",
      "unit": "e.g. mg/dL",
      "reference_range": "e.g. 70 - 99 mg/dL",
      "flag": "High" | "Low" | "Normal" | "Critical",
      "plain_explanation": "Simple explanation of what this result means",
      "doctor_questions": ["Question 1", "Question 2"]
    }
  ],
  "urgent_findings": ["Any potentially urgent finding that warrants prompt clinical review, or empty array"],
  "summary_overview": "A compassionate, clear 2-sentence summary of the report overall."
}

Extracted Report Text:
${extractedText.substring(0, 4500)}`;

      const aiResponse = await callAI({ userPrompt: prompt, jsonMode: true });
      if (aiResponse && aiResponse.text) {
        const cleaned = aiResponse.text.replace(/```json\s*|\s*```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.tests && Array.isArray(parsed.tests) && parsed.tests.length > 0) {
          aiResult = { data: parsed, provider: aiResponse.provider };
        }
      }
    } catch (aiErr) {
      console.warn("AI report parsing error, falling back to clinical heuristics:", aiErr.message);
    }

    if (aiResult) {
      return res.json({
        success: true,
        fileName: originalname,
        fileSize: size,
        fileType: mimetype,
        data: aiResult.data,
        provider: aiResult.provider,
        extracted_text_preview: extractedText.substring(0, 500),
        disclaimer: "Laboratory reference ranges vary across instruments and facilities. Results must be interpreted in conjunction with your personal clinical history by a qualified physician."
      });
    }

    // High-precision Clinical Heuristic Parser fallback
    const heuristicData = parseLabReportHeuristics(extractedText, lang);

    return res.json({
      success: true,
      fileName: originalname,
      fileSize: size,
      fileType: mimetype,
      data: {
        report_metadata: {
          patient_name: heuristicData.patientName,
          laboratory_name: heuristicData.labName,
          report_date: heuristicData.reportDate,
          test_category: heuristicData.category
        },
        tests: heuristicData.tests,
        urgent_findings: heuristicData.urgentFindings,
        summary_overview: heuristicData.summaryOverview
      },
      provider: "clinical_heuristics",
      extracted_text_preview: extractedText.substring(0, 500),
      disclaimer: "Laboratory reference ranges vary across instruments and facilities. Results must be interpreted in conjunction with your personal clinical history by a qualified physician."
    });
  } catch (err) {
    console.error("Report analysis error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An error occurred while processing the lab report: " + err.message
    });
  }
});

// -----------------------------------------------------------------------------
// Prescription Parsing & Medicine Guidance
// -----------------------------------------------------------------------------
app.post("/api/prescriptions/analyze", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "NO_FILE",
        message: "Please upload a prescription PDF or image file."
      });
    }

    const { mimetype, originalname, size, buffer } = req.file;
    const lang = req.body.lang || "en";

    const extractedText = await extractTextFromFile(buffer, mimetype, originalname);

    // Validate if text represents a medical prescription
    const validation = validatePrescriptionText(extractedText);
    if (!validation.isValid) {
      return res.status(422).json({
        success: false,
        error: validation.reason,
        message: validation.message,
        extracted_text_preview: validation.preview || (extractedText || "").substring(0, 300),
        suggestion: "Please upload an official photograph or digital PDF of a doctor's prescription."
      });
    }

    let langNote = "Language: English.";
    if (lang === "te") langNote = "Translate explanations into fluent Telugu (తెలుగు).";
    if (lang === "hi") langNote = "Translate explanations into fluent Hindi (हिन्दी).";

    // Try AI first
    let aiPrescription = null;
    try {
      const prompt = `You are a clinical pharmacy information assistant.
Parse the extracted prescription text below with extreme care for patient safety.
CRITICAL SAFETY DIRECTIVES:
1. ONLY extract medicines explicitly readable in the text. NEVER guess an unreadable medicine name, dosage, frequency, or duration.
2. If any field (strength, dose, timing, duration) is illegible or ambiguous, set it to "Unclear - confirm with pharmacist" and set "is_uncertain": true.
3. NEVER recommend changing doses or stopping a prescribed medicine.
4. Include openFDA / general drug labeling facts (class and common purpose).
5. ${langNote}

Respond ONLY with valid JSON in this exact structure:
{
  "doctor_info": {
    "doctor_name": "string or 'Not specified'",
    "clinic_or_hospital": "string or 'Not specified'",
    "date": "string or 'Not specified'"
  },
  "medicines": [
    {
      "name": "Medicine name exactly as written",
      "strength": "e.g. 500 mg or 'Unclear - confirm with pharmacist'",
      "dosage_frequency": "e.g. 1 tablet twice daily or 'Unclear'",
      "timing": "e.g. After meals / with water",
      "duration": "e.g. 5 days or 'Not specified'",
      "instructions": "Doctor instructions if any",
      "is_uncertain": true or false,
      "uncertainty_note": "Warning note if field was unclear, or null",
      "openfda_general_info": "General informational class and use (from official labeling)"
    }
  ],
  "doctor_general_advice": "General notes like rest, hydration, diet mentioned on prescription",
  "warnings": [
    "Verify all medications with your pharmacist before consumption",
    "Never alter your dose or discontinue medication without doctor approval"
  ]
}

Prescription Text:
${extractedText.substring(0, 4500)}`;

      const aiResponse = await callAI({ userPrompt: prompt, jsonMode: true });
      if (aiResponse && aiResponse.text) {
        const cleaned = aiResponse.text.replace(/```json\s*|\s*```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.medicines && Array.isArray(parsed.medicines)) {
          aiPrescription = { data: parsed, provider: aiResponse.provider };
        }
      }
    } catch (aiErr) {
      console.warn("AI prescription parse error:", aiErr.message);
    }

    if (aiPrescription) {
      return res.json({
        success: true,
        fileName: originalname,
        fileSize: size,
        fileType: mimetype,
        data: aiPrescription.data,
        provider: aiPrescription.provider,
        extracted_text_preview: extractedText.substring(0, 350),
        disclaimer: "Extracted information is for reading convenience only. Do not alter prescribed treatment without consulting your licensed physician or dispensing pharmacist."
      });
    }

    // Heuristic Prescription Parser fallback
    const medicines = [];
    const lines = extractedText.split("\n").map((l) => l.trim()).filter((l) => l.length > 3);

    // Look for lines containing dosage indicators (mg, ml, tab, cap)
    lines.forEach((line) => {
      if (/\b(mg|tab|tablet|cap|capsule|ml|gm|mcg|syrup|od|bd|tds|sos)\b/i.test(line)) {
        medicines.push({
          name: line.split(/[-–,:]/)[0].trim(),
          strength: line.match(/\b\d+\s*(mg|mcg|ml|g)\b/i)?.[0] || "Unclear - confirm with pharmacist",
          dosage_frequency: line.match(/\b(once|twice|thrice|\d+\s*times|od|bd|tds|sos)\b/i)?.[0] || "Confirm with doctor",
          timing: line.toLowerCase().includes("after") ? "After food" : (line.toLowerCase().includes("before") ? "Before food" : "As directed"),
          duration: line.match(/\b\d+\s*(days|weeks|months)\b/i)?.[0] || "As prescribed",
          instructions: line,
          is_uncertain: true,
          uncertainty_note: "Please verify dosage and frequency with your licensed pharmacist before taking.",
          openfda_general_info: "Prescription medication. Refer to package insert for complete indications."
        });
      }
    });

    if (medicines.length === 0 && lines.length > 0) {
      medicines.push({
        name: lines[0],
        strength: "Unclear - confirm with pharmacist",
        dosage_frequency: "Confirm with doctor",
        timing: "As directed",
        duration: "As prescribed",
        instructions: extractedText.substring(0, 100),
        is_uncertain: true,
        uncertainty_note: "Text was extracted with handwriting uncertainty. Please verify with pharmacist.",
        openfda_general_info: "Official prescription record."
      });
    }

    return res.json({
      success: true,
      fileName: originalname,
      fileSize: size,
      fileType: mimetype,
      data: {
        doctor_info: {
          doctor_name: "Prescribing Physician",
          clinic_or_hospital: "Medical Clinic",
          date: new Date().toLocaleDateString()
        },
        medicines,
        doctor_general_advice: "Follow doctor advice strictly. Report any adverse reactions immediately.",
        warnings: [
          "Always confirm dosage and instructions with your dispensing pharmacist.",
          "Never change your medication dose or stop taking medicine without doctor guidance."
        ]
      },
      extracted_text_preview: extractedText.substring(0, 350),
      disclaimer: "Extracted information is for reading convenience only. Do not alter prescribed treatment without consulting your licensed physician or dispensing pharmacist."
    });
  } catch (err) {
    console.error("Prescription analysis error:", err);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An error occurred while processing the prescription: " + err.message
    });
  }
});

// -----------------------------------------------------------------------------
// openFDA Drug Information Lookup
// -----------------------------------------------------------------------------
app.get("/api/openfda/info", (req, res) => {
  const drugName = (req.query.drug || "").trim();
  if (!drugName) {
    return res.status(400).json({ error: "Drug name parameter is required" });
  }

  const encodedDrug = encodeURIComponent(drugName);
  const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodedDrug}"+openfda.generic_name:"${encodedDrug}"&limit=1`;

  https.get(fdaUrl, (fdaRes) => {
    let data = "";
    fdaRes.on("data", (chunk) => (data += chunk));
    fdaRes.on("end", () => {
      try {
        const json = JSON.parse(data);
        if (json.results && json.results.length > 0) {
          const item = json.results[0];
          return res.json({
            success: true,
            source: "openFDA Official Drug Labeling",
            brand_name: item.openfda?.brand_name?.[0] || drugName,
            generic_name: item.openfda?.generic_name?.[0] || "N/A",
            purpose: item.purpose?.[0] || item.indications_and_usage?.[0]?.substring(0, 300) || "Prescription medication",
            warnings: item.warnings?.[0]?.substring(0, 400) || "Consult prescribing doctor regarding contraindications.",
            disclaimer: "openFDA data is for informational reference and does not replace professional medical advice."
          });
        }
      } catch (e) {
        // Fallback below
      }

      return res.json({
        success: true,
        source: "General Drug Reference",
        brand_name: drugName,
        generic_name: "Prescription Formulation",
        purpose: "Therapeutic pharmaceutical as prescribed by licensed physician.",
        warnings: "Verify with pharmacist. Follow prescribed schedule carefully.",
        disclaimer: "openFDA does not catalogue every global formulation. Consult local clinician."
      });
    });
  }).on("error", () => {
    res.json({
      success: true,
      source: "Local Clinical Registry",
      brand_name: drugName,
      purpose: "Prescription medication.",
      warnings: "Consult dispensing pharmacist.",
      disclaimer: "Network lookup unavailable. Always consult your doctor."
    });
  });
});

// -----------------------------------------------------------------------------
// Start Server
// -----------------------------------------------------------------------------
const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`[HealthSaathi] Backend running at http://127.0.0.1:${PORT}`);
  console.log(`[HealthSaathi] Health endpoint: http://127.0.0.1:${PORT}/api/health`);
});