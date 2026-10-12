// =============================================================================
// HealthSaathi - High-Precision Clinical Parser & Medical Document Validator
// =============================================================================

const clinicalLabKeywords = [
  // Tests & Biomarkers
  "hemoglobin", "haemoglobin", "hgb", "rbc", "wbc", "platelet", "platelets", "leukocyte", "erythrocyte",
  "neutrophil", "neutrophils", "lymphocyte", "lymphocytes", "eosinophil", "eosinophils", "monocyte", "monocytes",
  "basophil", "basophils", "esr", "glucose", "sugar", "cholesterol", "hdl", "ldl", "vldl", "triglyceride",
  "triglycerides", "creatinine", "urea", "bun", "uric acid", "bilirubin", "sgot", "sgpt", "ast", "alt",
  "alkaline phosphatase", "alp", "protein", "albumin", "globulin", "tsh", "thyroid", "t3", "t4", "ft3", "ft4",
  "calcium", "sodium", "potassium", "chloride", "vitamin d", "vitamin b12", "crp", "hba1c", "pcv", "mcv", "mch", "mchc",
  // Clinical Lab document markers
  "pathology", "diagnostic", "diagnostics", "hematology", "biochemistry", "clinical laboratory",
  "laboratory report", "investigation", "specimen", "reference range", "reference interval", "biological reference",
  "observed value", "test name", "normal range", "mg/dl", "g/dl", "mmol/l", "cells/cumm", "10^3/ul", "10^6/ul"
];

const prescriptionKeywords = [
  "dr.", "dr ", "doctor", "clinic", "hospital", "dispensary", "rx", "prescription",
  "tablet", "tab", "capsule", "cap", "syrup", "syp", "injection", "inj", "ointment", "drops",
  "mg", "mcg", "ml", "gm", "dosage", "dose", "od", "bd", "bid", "tds", "tid", "qid", "sos", "hs",
  "before food", "after food", "empty stomach", "pharmacy", "patient", "diagnosis"
];

/**
 * Validates whether OCR text represents an actual clinical laboratory report.
 */
function validateMedicalReportText(text) {
  if (!text || text.trim().length < 15) {
    return {
      isValid: false,
      reason: "UNREADABLE_FILE",
      message: "The uploaded file could not be read clearly. The scanned image or document contains too little readable text. Please upload a clear photo or official digital PDF."
    };
  }

  const textLower = text.toLowerCase();
  let matchCount = 0;
  for (const kw of clinicalLabKeywords) {
    const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(textLower)) matchCount++;
  }

  if (matchCount < 2) {
    return {
      isValid: false,
      reason: "NOT_A_LAB_REPORT",
      message: "The uploaded file does not appear to be a clinical laboratory report. HealthSaathi did not detect any diagnostic biomarkers, lab units, or reference ranges in this image.",
      preview: text.trim().substring(0, 280)
    };
  }

  return { isValid: true, matchCount };
}

/**
 * Validates whether OCR text represents a medical prescription.
 */
function validatePrescriptionText(text) {
  if (!text || text.trim().length < 10) {
    return {
      isValid: false,
      reason: "UNREADABLE_PRESCRIPTION",
      message: "Doctor handwriting or image quality was unreadable. Medicine names and dosages cannot be safely determined. Please upload a clearer scan."
    };
  }

  const textLower = text.toLowerCase();
  let matchCount = 0;
  for (const kw of prescriptionKeywords) {
    const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(textLower)) matchCount++;
  }

  if (matchCount < 2) {
    return {
      isValid: false,
      reason: "NOT_A_PRESCRIPTION",
      message: "The uploaded file does not appear to be a medical prescription. No medicines, dosages, or doctor instructions were detected in this image.",
      preview: text.trim().substring(0, 280)
    };
  }

  return { isValid: true, matchCount };
}

// 40+ Clinical Laboratory Biomarkers with Multi-Language explanations (en, te, hi)
const commonLabMarkers = [
  // --- COMPLETE BLOOD COUNT (CBC) ---
  {
    id: "hb",
    name: "Hemoglobin (Hb)",
    aliases: ["hemoglobin", "haemoglobin", "hgb", "hb"],
    unit: "g/dL",
    normalMin: 12.0,
    normalMax: 16.5,
    criticalMin: 7.0,
    criticalMax: 20.0,
    desc: {
      en: "Protein in red blood cells that transports oxygen to your body's tissues.",
      te: "శరీర కణజాలాలకు ఆక్సిజన్‌ను మోసుకెళ్ళే ఎర్ర రక్త కణాల్లోని ముఖ్యమైన ప్రోటీన్.",
      hi: "लाल रक्त कोशिकाओं में मौजूद प्रोटीन जो शरीर के सभी अंगों तक ऑक्सीजन पहुंचाता है।"
    },
    doctorQ: {
      en: ["Does this hemoglobin level suggest anemia or require iron evaluation?", "Would any dietary changes help maintain normal oxygen levels?"],
      te: ["ఈ హిమోగ్లోబిన్ స్థాయి రక్తహీనతను సూచిస్తుందా?", "ఆహారంలో ఎలాంటి మార్పులు అవసరం?"],
      hi: ["क्या यह हीमोग्लोबिन स्तर एनीमिया का संकेत देता है?", "क्या मुझे आयरन युक्त आहार लेने की सलाह दी जाती है?"]
    }
  },
  {
    id: "wbc",
    name: "Total Leukocyte Count (WBC)",
    aliases: ["total leukocyte count", "total wbc", "wbc count", "white blood cell", "tlc"],
    unit: "cells/cumm",
    normalMin: 4000,
    normalMax: 11000,
    criticalMin: 2000,
    criticalMax: 30000,
    desc: {
      en: "Primary immune defense cells fighting bacterial and viral infections.",
      te: "శరీరాన్ని ఇన్ఫెక్షన్ల నుండి రక్షించే రోగనిరోధక వ్యవస్థ తెల్ల రక్త కణాలు.",
      hi: "शरीर की प्रतिरक्षा कोशिकाएं जो संक्रमण और बीमारियों से लड़ती हैं।"
    },
    doctorQ: {
      en: ["Does this white blood cell count indicate active infection or inflammation?", "Should this count be rechecked?"],
      te: ["ఈ తెల్ల రక్త కణాల సంఖ్య ఏదైనా ఇన్ఫెక్షన్‌ను సూచిస్తుందా?", "మళ్ళీ ఎప్పుడు పరీక్ష చేయించాలి?"],
      hi: ["क्या यह श्वेत रक्त कोशिका स्तर किसी संक्रमण का संकेत देता है?", "क्या इसे दोबारा जांचने की आवश्यकता है?"]
    }
  },
  {
    id: "platelets",
    name: "Platelet Count",
    aliases: ["platelet count", "platelets", "thrombocyte"],
    unit: "cells/cumm",
    normalMin: 150000,
    normalMax: 450000,
    criticalMin: 50000,
    criticalMax: 800000,
    desc: {
      en: "Specialized cell fragments essential for normal blood clotting and wound healing.",
      te: "రక్తం గడ్డకట్టడానికి మరియు గాయాలు మానడానికి అవసరమైన రక్తఫలకికలు (ప్లేట్‌లెట్స్).",
      hi: "रक्त के थक्के बनने और घाव भरने के लिए आवश्यक रक्त कणिकाएं (प्लेटलेट्स)।"
    },
    doctorQ: {
      en: ["Is this platelet count safe against bleeding or clotting risks?", "Are any precautions needed?"],
      te: ["ఈ ప్లేట్‌లెట్ల సంఖ్య సాధారణ రక్షణకు సరిపోతుందా?", "ఏవైనా మందుల జాగ్రత్తలు అవసరమా?"],
      hi: ["क्या यह प्लेटलेट काउंट सुरक्षित है?", "क्या मुझे कोई विशेष सावधानी बरतनी चाहिए?"]
    }
  },
  {
    id: "rbc",
    name: "Total RBC Count",
    aliases: ["total rbc count", "rbc count", "red blood cell count", "erythrocyte count"],
    unit: "10^6/uL",
    normalMin: 4.0,
    normalMax: 5.9,
    criticalMin: 2.5,
    criticalMax: 7.5,
    desc: {
      en: "Total circulating count of red blood cells carrying respiratory gases.",
      te: "ఆక్సిజన్‌ను మోసుకెళ్ళే ఎర్ర రక్త కణాల మొత్తం సంఖ్య.",
      hi: "रक्त में उपस्थित लाल रक्त कोशिकाओं की कुल संख्या।"
    },
    doctorQ: {
      en: ["Does this RBC count align with my general energy and blood parameters?"],
      te: ["ఈ ఎర్ర రక్త కణాల సంఖ్య సాధారణ పరిధిలో ఉందా?"],
      hi: ["क्या यह आरबीसी संख्या सामान्य स्तर पर है?"]
    }
  },
  {
    id: "pcv",
    name: "Packed Cell Volume (PCV / Hematocrit)",
    aliases: ["packed cell volume", "hematocrit", "pcv", "hct"],
    unit: "%",
    normalMin: 36.0,
    normalMax: 50.0,
    criticalMin: 20.0,
    criticalMax: 60.0,
    desc: {
      en: "The percentage volume of blood occupied by red blood cells.",
      te: "మొత్తం రక్త పరిమాణంలో ఎర్ర రక్త కణాల శాతం (హెమటోక్రిట్).",
      hi: "कुल रक्त में लाल रक्त कोशिकाओं का प्रतिशत अनुपात।"
    },
    doctorQ: {
      en: ["Does this hematocrit percentage correlate with hydration or anemia?"],
      te: ["ఈ కొలత శరీరంలో నీటిశాతం లేదా రక్తహీనతను ప్రతిబింబిస్తుందా?"],
      hi: ["क्या यह स्तर डिहाइड्रेशन या खून की कमी का संकेत है?"]
    }
  },
  {
    id: "mcv",
    name: "Mean Corpuscular Volume (MCV)",
    aliases: ["mean corpuscular volume", "mcv"],
    unit: "fL",
    normalMin: 80.0,
    normalMax: 100.0,
    desc: {
      en: "Average physical size of individual red blood cells.",
      te: "ఎర్ర రక్త కణాల సగటు పరిమాణం.",
      hi: "लाल रक्त कोशिकाओं का औसत आकार।"
    },
    doctorQ: {
      en: ["Does this MCV indicate microcytic or macrocytic cell size?"],
      te: ["ఈ MCV కణాల పరిమాణాన్ని ఎలా సూచిస్తుంది?"],
      hi: ["क्या यह आकार सामान्य लाल रक्त कोशिकाओं का है?"]
    }
  },
  {
    id: "mch",
    name: "Mean Corpuscular Hemoglobin (MCH)",
    aliases: ["mean corpuscular hemoglobin", "mch"],
    unit: "pg",
    normalMin: 27.0,
    normalMax: 33.0,
    desc: {
      en: "Average amount of hemoglobin inside a single red blood cell.",
      te: "ఒక్కో ఎర్ర రక్త కణంలో ఉండే సగటు హిమోగ్లోబిన్ పరిమాణం.",
      hi: "एकल लाल रक्त कोशिका में हीमोग्लोबिन की औसत मात्रा।"
    },
    doctorQ: {
      en: ["Is the hemoglobin content per cell within expected limits?"],
      te: ["కణాలలోని హిమోగ్లోబిన్ కంటెంట్ సాధారణంగా ఉందా?"],
      hi: ["क्या कोशिका में हीमोग्लोबिन स्तर सामान्य है?"]
    }
  },
  {
    id: "neutrophils",
    name: "Neutrophils",
    aliases: ["neutrophils", "neutrophil", "polymorphs"],
    unit: "%",
    normalMin: 40.0,
    normalMax: 75.0,
    desc: {
      en: "First-responder white blood cells targeted against acute bacterial infections.",
      te: "బ్యాక్టీరియా ఇన్ఫెక్షన్లపై త్వరితగతిన పోరాడే తెల్ల రక్త కణాలు.",
      hi: "जीवाणु (बैक्टीरियल) संक्रमण से लड़ने वाली प्राथमिक प्रतिरक्षा कोशिकाएं।"
    },
    doctorQ: {
      en: ["Does the neutrophil percentage indicate acute bacterial response?"],
      te: ["ఈ న్యూట్రోఫిల్ శాతం ఏదైనా ఇన్ఫెక్షన్‌ను ప్రతిబింబిస్తుందా?"],
      hi: ["क्या यह प्रतिशत हाल के संक्रमण का संकेत देता है?"]
    }
  },
  {
    id: "lymphocytes",
    name: "Lymphocytes",
    aliases: ["lymphocytes", "lymphocyte"],
    unit: "%",
    normalMin: 20.0,
    normalMax: 45.0,
    desc: {
      en: "White blood cells providing antibodies and immunity against viral threats.",
      te: "వైరల్ ఇన్ఫెక్షన్లకు వ్యతిరేకంగా యాంటీబాడీలను తయారుచేసే రోగనిరోధక కణాలు.",
      hi: "वायरल संक्रमणों से बचाव करने वाली एंटीबॉडी निर्माता कोशिकाएं।"
    },
    doctorQ: {
      en: ["Does the lymphocyte proportion suggest viral exposure or immune activity?"],
      te: ["ఈ లింఫోసైట్ శాతం వైరల్ ఇన్ఫెక్షన్‌ను సూచిస్తుందా?"],
      hi: ["क्या यह स्तर किसी वायरल संक्रमण से संबंधित है?"]
    }
  },
  {
    id: "esr",
    name: "Erythrocyte Sedimentation Rate (ESR)",
    aliases: ["erythrocyte sedimentation rate", "esr"],
    unit: "mm/hr",
    normalMin: 0.0,
    normalMax: 20.0,
    desc: {
      en: "Nonspecific clinical marker for systemic inflammation in the body.",
      te: "శరీరంలో వాపు లేదా ఇన్ఫ్లమేషన్‌ను సూచించే రక్త పరీక్ష (ESR).",
      hi: "शरीर में सूजन (इन्फ्लेमेशन) को मापने वाला गैर-विशिष्ट मार्कर।"
    },
    doctorQ: {
      en: ["Does this ESR level suggest underlying inflammatory activity?"],
      te: ["ఈ ESR శరీరంలో ఏదైనా ఇన్ఫ్లమేషన్‌ను సూచిస్తుందా?"],
      hi: ["क्या यह स्तर शरीर में किसी सूजन का संकेत देता है?"]
    }
  },

  // --- BLOOD GLUCOSE & DIABETES ---
  {
    id: "fbs",
    name: "Fasting Blood Sugar (FBS)",
    aliases: ["fasting blood sugar", "fasting blood glucose", "fasting plasma glucose", "fasting glucose", "fbs"],
    unit: "mg/dL",
    normalMin: 70,
    normalMax: 99,
    criticalMin: 50,
    criticalMax: 300,
    desc: {
      en: "Circulating blood sugar concentration measured after an overnight fast (8-10 hours).",
      te: "రాత్రంతా ఉపవాసం (8-10 గంటలు) తర్వాత రక్తంలో చక్కెర స్థాయి.",
      hi: "रात भर उपवास (8-10 घंटे) के बाद मापा गया रक्त शर्करा (ग्लूकोज) स्तर।"
    },
    doctorQ: {
      en: ["Does this fasting sugar level indicate prediabetes or diabetes?", "Is an HbA1c test recommended?"],
      te: ["ఈ షుగర్ స్థాయి మధుమేహం లేదా ప్రీ-డయాబెటిస్‌ను సూచిస్తుందా?", "HbA1c పరీక్ష చేయించాలా?"],
      hi: ["क्या यह स्तर प्रीडायबिटीज या डायबिटीज का संकेत देता है?", "क्या मुझे HbA1c टेस्ट कराना चाहिए?"]
    }
  },
  {
    id: "ppbs",
    name: "Post Prandial Blood Sugar (PPBS)",
    aliases: ["post prandial blood sugar", "post prandial glucose", "ppbs", "pp blood sugar"],
    unit: "mg/dL",
    normalMin: 70,
    normalMax: 140,
    criticalMin: 50,
    criticalMax: 350,
    desc: {
      en: "Blood glucose measured exactly 2 hours after a meal to observe insulin response.",
      te: "భోజనం చేసిన 2 గంటల తర్వాత ఇన్సులిన్ పనితీరును పరిశీలించే రక్త చక్కెర స్థాయి.",
      hi: "भोजन के 2 घंटे बाद इंसुलिन की प्रतिक्रिया जांचने वाला रक्त शर्करा स्तर।"
    },
    doctorQ: {
      en: ["How does this post-meal glucose reading reflect insulin efficiency?"],
      te: ["భోజనం తర్వాత ఈ షుగర్ రీడింగ్ సాధారణ పరిధిలో ఉందా?"],
      hi: ["क्या भोजन के बाद का यह ग्लूकोज स्तर सामान्य है?"]
    }
  },
  {
    id: "hba1c",
    name: "Glycated Hemoglobin (HbA1c)",
    aliases: ["glycated hemoglobin", "glycosylated hemoglobin", "hba1c"],
    unit: "%",
    normalMin: 4.0,
    normalMax: 5.6,
    criticalMax: 11.0,
    desc: {
      en: "Golden standard representing average blood sugar control over the past 2 to 3 months.",
      te: "గత 2-3 నెలల సగటు రక్త చక్కెర నియంత్రణను తెలిపే గోల్డెన్ స్టాండర్డ్ పరీక్ష (HbA1c).",
      hi: "पिछले 2-3 महीनों के औसत रक्त शर्करा नियंत्रण को दर्शाने वाला मानक टेस्ट।"
    },
    doctorQ: {
      en: ["What is my target HbA1c based on my personal health history?", "Are medication or lifestyle adjustments indicated?"],
      te: ["నా ప్రస్తుత HbA1c స్థాయి ఆధారంగా ఏవైనా మార్పులు చేయాలా?"],
      hi: ["क्या इस HbA1c स्तर के अनुसार दवा या खान-पान में बदलाव की जरूरत है?"]
    }
  },

  // --- LIPID PROFILE (HEART HEALTH) ---
  {
    id: "cholesterol",
    name: "Total Cholesterol",
    aliases: ["total cholesterol", "serum cholesterol", "cholesterol total"],
    unit: "mg/dL",
    normalMin: 125,
    normalMax: 200,
    criticalMin: 100,
    criticalMax: 350,
    desc: {
      en: "Combined circulating levels of all lipid fractions in the blood.",
      te: "రక్తంలోని మొత్తం కొలెస్ట్రాల్ మరియు కొవ్వుల సమ్మేళనం.",
      hi: "रक्त में उपस्थित कुल कोलेस्ट्रॉल और वसा का स्तर।"
    },
    doctorQ: {
      en: ["How does this total cholesterol score impact overall cardiovascular risk?", "What dietary adjustments or lipid targets are best?"],
      te: ["ఈ కొలెస్ట్రాల్ స్థాయి గుండె ఆరోగ్యానికి ఎలా ప్రభావం చూపుతుంది?", "ఆహారంలో ఎలాంటి మార్పులు చేయాలి?"],
      hi: ["क्या यह स्तर हृदय स्वास्थ्य के लिए जोखिम पैदा करता है?", "आहार में क्या बदलाव करने चाहिए?"]
    }
  },
  {
    id: "hdl",
    name: "HDL Cholesterol (Good)",
    aliases: ["hdl cholesterol", "high density lipoprotein", "hdl"],
    unit: "mg/dL",
    normalMin: 40,
    normalMax: 60,
    criticalMin: 20,
    criticalMax: 100,
    desc: {
      en: "Protective cholesterol that removes excess fats from arterial walls back to the liver.",
      te: "ధమనుల నుండి అదనపు కొవ్వును తొలగించే మంచి కొలెస్ట్రాల్ (HDL).",
      hi: "सुरक्षात्मक 'अच्छा' कोलेस्ट्रॉल जो धमनियों से अतिरिक्त वसा हटाने में मदद करता है।"
    },
    doctorQ: {
      en: ["Is my protective HDL level optimal for cardiovascular wellness?", "What physical exercises increase HDL naturally?"],
      te: ["నా మంచి కొలెస్ట్రాల్ స్థాయి సరిపోతుందా?", "వ్యాయామం ద్వారా దీన్ని ఎలా పెంచుకోవచ్చు?"],
      hi: ["क्या मेरा अच्छा कोलेस्ट्रॉल स्तर सामान्य है?", "इसे प्राकृतिक रूप से कैसे बढ़ाएं?"]
    }
  },
  {
    id: "ldl",
    name: "LDL Cholesterol (Bad)",
    aliases: ["ldl cholesterol", "low density lipoprotein", "ldl"],
    unit: "mg/dL",
    normalMin: 50,
    normalMax: 100,
    criticalMin: 30,
    criticalMax: 220,
    desc: {
      en: "Atherogenic lipid particle that deposits in blood vessel walls when elevated.",
      te: "రక్తనాళాల గోడలలో పేరుకుపోయే ప్రమాదకరమైన చెడు కొలెస్ట్రాల్ (LDL).",
      hi: "धमनियों में जमा होने वाला 'खराब' कोलेस्ट्रॉल, जिसका अधिक होना हानिकारक हो सकता है।"
    },
    doctorQ: {
      en: ["Does my LDL reading require lipid therapy or lifestyle intervention?", "What is my target LDL?"],
      te: ["ఈ చెడు కొలెస్ట్రాల్ తగ్గించడానికి మందులు లేదా వ్యాయామం అవసరమా?"],
      hi: ["क्या इसे कम करने के लिए दवा या जीवनशैली में बदलाव की आवश्यकता है?"]
    }
  },
  {
    id: "triglycerides",
    name: "Serum Triglycerides",
    aliases: ["serum triglycerides", "triglycerides", "triglyceride"],
    unit: "mg/dL",
    normalMin: 50,
    normalMax: 150,
    criticalMax: 500,
    desc: {
      en: "Storage fats circulating in the bloodstream derived from excess dietary calories.",
      te: "అదనపు కేలరీల నుండి రక్తంలో చేరే కొవ్వు నిల్వలు (ట్రైగ్లిజరైడ్స్).",
      hi: "रक्त में मौजूद वसा के कण जो अतिरिक्त कैलोरी से बनते हैं।"
    },
    doctorQ: {
      en: ["Do my triglyceride levels indicate a need to reduce refined carbohydrates or sugars?"],
      te: ["ఈ ట్రైగ్లిజరైడ్స్ తగ్గించడానికి ఆహారంలో ఎలాంటి నియమాలు పాటించాలి?"],
      hi: ["क्या इसके लिए मीठा या कार्बोहाइड्रेट कम करने की जरूरत है?"]
    }
  },

  // --- KIDNEY FUNCTION (KFT / RFT) ---
  {
    id: "creatinine",
    name: "Serum Creatinine",
    aliases: ["serum creatinine", "creatinine serum", "creatinine"],
    unit: "mg/dL",
    normalMin: 0.6,
    normalMax: 1.2,
    criticalMin: 0.3,
    criticalMax: 4.0,
    desc: {
      en: "Natural muscle metabolic breakdown product filtered out of the blood by healthy kidneys.",
      te: "ఆరోగ్యకరమైన మూత్రపిండాల ద్వారా రక్తం నుండి తొలగించబడే కండరాల వ్యర్థ పదార్థం.",
      hi: "मांसपेशियों के चयापचय से बनने वाला अपशिष्ट पदार्थ जिसे गुर्दे (किडनी) साफ करते हैं।"
    },
    doctorQ: {
      en: ["Does this creatinine reading reflect healthy kidney filtration (eGFR)?", "Should hydration or protein intake be modified?"],
      te: ["ఈ కొలత కిడ్నీల పనితీరు సరిగ్గా ఉందని తెలుపుతుందా?", "నీటి వినియోగంలో మార్పులు అవసరమా?"],
      hi: ["क्या यह स्तर गुर्दे के सामान्य कामकाज को दर्शाता है?"]
    }
  },
  {
    id: "urea",
    name: "Blood Urea / BUN",
    aliases: ["blood urea nitrogen", "blood urea", "bun", "urea"],
    unit: "mg/dL",
    normalMin: 15.0,
    normalMax: 45.0,
    criticalMax: 100.0,
    desc: {
      en: "Nitrogen waste product formed during dietary protein digestion and cleared by kidneys.",
      te: "ప్రోటీన్ జీర్ణక్రియ ద్వారా ఏర్పడి మూత్రపిండాల ద్వారా విసర్జించబడే యూరియా.",
      hi: "प्रोटीन के पाचन से बनने वाला अपशिष्ट जिसे गुर्दे बाहर निकालते हैं।"
    },
    doctorQ: {
      en: ["Does this urea level indicate dehydration or kidney clearance changes?"],
      te: ["ఈ యూరియా స్థాయి నీటిశాతం తగ్గడం వల్ల పెరిగిందా?"],
      hi: ["क्या यह स्तर डिहाइड्रेशन या किडनी कार्यप्रणाली में बदलाव का संकेत है?"]
    }
  },
  {
    id: "uric_acid",
    name: "Serum Uric Acid",
    aliases: ["serum uric acid", "uric acid"],
    unit: "mg/dL",
    normalMin: 3.5,
    normalMax: 7.2,
    criticalMax: 12.0,
    desc: {
      en: "Chemical created when the body breaks down purines found in certain foods and cells.",
      te: "శరీరంలో ప్యూరిన్ల విచ్ఛిన్నం వల్ల ఏర్పడే యూరిక్ యాసిడ్ (కీళ్ల నొప్పులతో సంబంధం కలిగి ఉంటుంది).",
      hi: "शरीर में प्यूरीन के टूटने से बनने वाला यूरिक एसिड जो जोड़ों के दर्द से जुड़ा हो सकता है।"
    },
    doctorQ: {
      en: ["Does this uric acid reading carry risk for gout or kidney stones?"],
      te: ["ఈ యూరిక్ యాసిడ్ కీళ్ల నొప్పులు లేదా కిడ్నీ రాళ్ల ముప్పును సూచిస్తుందా?"],
      hi: ["क्या यह स्तर गाउट (जोड़ों के दर्द) या पथरी का जोखिम बढ़ाता है?"]
    }
  },

  // --- LIVER FUNCTION (LFT) ---
  {
    id: "bilirubin",
    name: "Total Bilirubin",
    aliases: ["serum bilirubin total", "total bilirubin", "bilirubin total", "bilirubin"],
    unit: "mg/dL",
    normalMin: 0.2,
    normalMax: 1.2,
    criticalMin: 0.1,
    criticalMax: 5.0,
    desc: {
      en: "Yellowish compound formed during normal red blood cell breakdown, cleared by the liver.",
      te: "ఎర్ర రక్త కణాలు విచ్ఛిన్నమైనప్పుడు కాలేయం ద్వారా శుద్ధి చేయబడే పసుపు వర్ణద్రవ్యం.",
      hi: "लाल रक्त कोशिकाओं के टूटने से बनने वाला पदार्थ जिसे लिवर प्रोसेस करता है।"
    },
    doctorQ: {
      en: ["Does this bilirubin value indicate healthy liver and biliary clearance?"],
      te: ["ఈ బిలిరుబిన్ స్థాయి కాలేయ ఆరోగ్యాన్ని ప్రతిబింబిస్తుందా?"],
      hi: ["क्या यह स्तर लिवर के स्वस्थ कामकाज का संकेत देता है?"]
    }
  },
  {
    id: "sgot",
    name: "SGOT / AST (Liver Enzyme)",
    aliases: ["sgot", "ast", "aspartate aminotransferase"],
    unit: "U/L",
    normalMin: 10,
    normalMax: 40,
    criticalMax: 300,
    desc: {
      en: "Enzyme found in liver cells, heart, and muscle tissue.",
      te: "కాలేయం, గుండె మరియు కండరాల కణాలలో ఉండే ముఖ్యమైన ఎంజైమ్.",
      hi: "लिवर, हृदय और मांसपेशियों की कोशिकाओं में पाया जाने वाला एंजाइम।"
    },
    doctorQ: {
      en: ["Does this SGOT/AST reading suggest liver stress or muscular fatigue?"],
      te: ["ఈ ఎంజైమ్ స్థాయి కాలేయ అలసటను సూచిస్తుందా?"],
      hi: ["क्या यह एंजाइम स्तर लिवर पर किसी तनाव का संकेत है?"]
    }
  },
  {
    id: "sgpt",
    name: "SGPT / ALT (Liver Enzyme)",
    aliases: ["sgpt", "alt", "alanine aminotransferase"],
    unit: "U/L",
    normalMin: 10,
    normalMax: 45,
    criticalMax: 300,
    desc: {
      en: "Highly specific enzyme localized in liver tissue, sensitive to liver inflammation.",
      te: "కాలేయ కణజాలానికి అత్యంత నిర్దిష్టమైన ఎంజైమ్ (కాలేయ ఆరోగ్యానికి కీలకమైన కొలత).",
      hi: "लिवर के ऊतकों के लिए अत्यधिक विशिष्ट एंजाइम जो लिवर स्वास्थ्य को दर्शाता है।"
    },
    doctorQ: {
      en: ["Is my ALT enzyme within optimal ranges, or is fatty liver evaluation indicated?"],
      te: ["ఈ SGPT స్థాయి ఆధారంగా ఫ్యాటీ లివర్ పరీక్ష అవసరమా?"],
      hi: ["क्या यह स्तर फैटी लिवर या लिवर की सूजन का संकेत देता है?"]
    }
  },
  {
    id: "alp",
    name: "Alkaline Phosphatase (ALP)",
    aliases: ["alkaline phosphatase", "alp"],
    unit: "U/L",
    normalMin: 44,
    normalMax: 147,
    criticalMax: 500,
    desc: {
      en: "Enzyme related to bile duct patency and bone metabolism.",
      te: "పిత్త వాహికలు మరియు ఎముకల జీవక్రియతో సంబంధం ఉన్న ఎంజైమ్.",
      hi: "पित्त नलिकाओं और हड्डियों के चयापचय से जुड़ा एंजाइम।"
    },
    doctorQ: {
      en: ["Does this ALP level suggest biliary clearance or bone health changes?"],
      te: ["ఈ ALP కొలత పిత్తాశయం లేదా ఎముకల ఆరోగ్యాన్ని ఎలా ప్రతిబింబిస్తుంది?"],
      hi: ["क्या यह स्तर पित्त या हड्डियों के स्वास्थ्य से संबंधित है?"]
    }
  },

  // --- THYROID PROFILE ---
  {
    id: "tsh",
    name: "Thyroid Stimulating Hormone (TSH)",
    aliases: ["thyroid stimulating hormone", "ultra tsh", "tsh"],
    unit: "uIU/mL",
    normalMin: 0.4,
    normalMax: 4.5,
    criticalMin: 0.1,
    criticalMax: 20.0,
    desc: {
      en: "Pituitary hormone regulating the activity and hormone production of the thyroid gland.",
      te: "థైరాయిడ్ గ్రంధి పనితీరును నియంత్రించే పిట్యూటరీ హార్మోన్ (TSH).",
      hi: "थायरॉयड ग्रंथि के कामकाज को नियंत्रित करने वाला पिट्यूटरी हार्मोन।"
    },
    doctorQ: {
      en: ["Does this TSH indicate healthy thyroid activity, hypothyroidism, or hyperthyroidism?", "Should T3 and T4 be evaluated?"],
      te: ["ఈ TSH స్థాయి హైపోథైరాయిడిజం లేదా హైపర్‌థైరాయిడిజంను సూచిస్తుందా?"],
      hi: ["क्या यह TSH स्तर थायरॉयड ग्रंथि के सामान्य कामकाज को दर्शाता है?"]
    }
  },

  // --- ELECTROLYTES & VITAMINS ---
  {
    id: "calcium",
    name: "Serum Calcium",
    aliases: ["serum calcium", "calcium total", "calcium"],
    unit: "mg/dL",
    normalMin: 8.5,
    normalMax: 10.5,
    criticalMin: 6.5,
    criticalMax: 13.0,
    desc: {
      en: "Essential mineral for bone strength, nerve signaling, and muscle contraction.",
      te: "ఎముకల బలం, నరాల పనితీరు మరియు కండరాల కదలికలకు అత్యవసరమైన ఖనిజం.",
      hi: "हड्डियों की मजबूती, तंत्रिका तंत्र और मांसपेशियों के लिए आवश्यक खनिज।"
    },
    doctorQ: {
      en: ["Is this calcium level optimal for skeletal and cardiovascular wellness?"],
      te: ["ఈ కాల్షియం స్థాయి ఎముకల ఆరోగ్యానికి సరిపోతుందా?"],
      hi: ["क्या यह कैल्शियम स्तर हड्डियों के स्वास्थ्य के लिए पर्याप्त है?"]
    }
  },
  {
    id: "potassium",
    name: "Serum Potassium",
    aliases: ["serum potassium", "potassium", "k+"],
    unit: "mmol/L",
    normalMin: 3.5,
    normalMax: 5.1,
    criticalMin: 2.8,
    criticalMax: 6.5,
    desc: {
      en: "Vital electrolyte maintaining cardiac rhythm and cellular electrical activity.",
      te: "గుండె లయను మరియు కణాల విద్యుత్ సమతుల్యతను నియంత్రించే ముఖ్యమైన ఎలక్ట్రోలైట్.",
      hi: "हृदय की धड़कन और कोशिकाओं की कार्यप्रणाली को स्थिर रखने वाला महत्वपूर्ण इलेक्ट्रोलाइट।"
    },
    doctorQ: {
      en: ["Is my potassium balance safe for regular heart rhythm and kidney health?"],
      te: ["ఈ పొటాషియం స్థాయి గుండె లయకు సురక్షితంగా ఉందా?"],
      hi: ["क्या यह पोटेशियम स्तर हृदय और किडनी के लिए सामान्य है?"]
    }
  },
  {
    id: "vitamin_d",
    name: "Vitamin D (25-OH)",
    aliases: ["vitamin d", "25-oh vitamin d", "25-hydroxy vitamin d"],
    unit: "ng/mL",
    normalMin: 30.0,
    normalMax: 100.0,
    criticalMin: 10.0,
    desc: {
      en: "Fat-soluble vitamin regulating calcium absorption and supporting immune strength.",
      te: "కాల్షియం శోషణ మరియు రోగనిరోధక శక్తికి అవసరమైన విటమిన్ డి.",
      hi: "कैल्शियम अवशोषण और रोग प्रतिरोधक क्षमता को बढ़ाने वाला आवश्यक विटामिन डी।"
    },
    doctorQ: {
      en: ["Does this Vitamin D level warrant oral supplementation or sun exposure advice?"],
      te: ["ఈ విటమిన్ డి స్థాయి ఆధారంగా సప్లిమెంట్స్ తీసుకోవాలా?"],
      hi: ["क्या मुझे विटामिन डी सप्लीमेंट लेने की आवश्यकता है?"]
    }
  },
  {
    id: "vitamin_b12",
    name: "Vitamin B12",
    aliases: ["vitamin b12", "cyanocobalamin", "b12"],
    unit: "pg/mL",
    normalMin: 200.0,
    normalMax: 900.0,
    criticalMin: 150.0,
    desc: {
      en: "Essential vitamin for neurological nerve health and red blood cell formation.",
      te: "నరాల పనితీరు మరియు ఎర్ర రక్త కణాల తయారీకి కీలకమైన విటమిన్ B12.",
      hi: "तंत्रिका तंत्र के स्वास्थ्य और लाल रक्त कोशिकाओं के निर्माण के लिए आवश्यक विटामिन B12।"
    },
    doctorQ: {
      en: ["Does my B12 reading support healthy nerve sensation and red cell maturation?"],
      te: ["ఈ B12 స్థాయి నరాల ఆరోగ్యానికి మరియు రక్త కణాలకు సరిపోతుందా?"],
      hi: ["क्या यह स्तर तंत्रिका स्वास्थ्य के लिए अनुकूल है?"]
    }
  }
];

/**
 * High-precision clinical heuristic parser for lab reports.
 */
function parseLabReportHeuristics(rawText, lang = "en") {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const detectedTests = [];
  const handledIds = new Set();

  for (const marker of commonLabMarkers) {
    if (handledIds.has(marker.id)) continue;

    for (const line of lines) {
      let matchedAlias = null;
      let aliasIndex = -1;

      for (const alias of marker.aliases) {
        const escaped = alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
        const reg = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, "i");
        const match = reg.exec(line);
        if (match) {
          matchedAlias = alias;
          // Find start of alias within the match
          aliasIndex = match.index + match[0].toLowerCase().indexOf(alias.toLowerCase());
          break;
        }
      }

      if (!matchedAlias || aliasIndex < 0) continue;

      const textAfter = line.substring(aliasIndex + matchedAlias.length);

      // Extract numbers (including commas e.g. 240,000 or decimals e.g. 10.8)
      const numMatches = textAfter.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b|\b\d+(?:\.\d+)?\b/g);
      if (numMatches && numMatches.length > 0) {
        const rawValStr = numMatches[0].replace(/,/g, "");
        const numVal = parseFloat(rawValStr);
        if (isNaN(numVal)) continue;

        let flag = "Normal";
        if (numVal > marker.normalMax) flag = "High";
        if (numVal < marker.normalMin) flag = "Low";
        if (marker.criticalMax && numVal >= marker.criticalMax) flag = "Critical";
        if (marker.criticalMin && numVal <= marker.criticalMin) flag = "Critical";

        const plainDesc = marker.desc[lang] || marker.desc.en;
        const questions = marker.doctorQ[lang] || marker.doctorQ.en;

        detectedTests.push({
          test_name: marker.name,
          reported_value: numMatches[0],
          unit: marker.unit,
          reference_range: `${marker.normalMin} - ${marker.normalMax} ${marker.unit}`,
          flag,
          plain_explanation: plainDesc,
          doctor_questions: questions
        });

        handledIds.add(marker.id);
        break;
      }
    }
  }

  // Extract Patient Name
  let patientName = "From Uploaded Report";
  for (const line of lines) {
    const ptMatch = line.match(/(?:patient\s*name|pt\.?\s*name|patient)\s*[:\-]\s*([A-Za-z\s.]+)/i);
    if (ptMatch && ptMatch[1].trim().length > 2) {
      patientName = ptMatch[1].trim().split(/\s{2,}/)[0].trim();
      break;
    }
  }

  // Extract Laboratory Name
  let labName = "Diagnostic Center (from report)";
  for (const line of lines.slice(0, 10)) {
    if (/(?:hospital|diagnostic|pathology|laboratory|clinical|lab\b|healthcare|scan)/i.test(line)) {
      labName = line.replace(/[:\-]/g, "").trim().substring(0, 60);
      break;
    }
  }

  // Extract Date
  let reportDate = new Date().toLocaleDateString();
  for (const line of lines) {
    const dtMatch = line.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/);
    if (dtMatch) {
      reportDate = dtMatch[1];
      break;
    }
  }

  // Determine category
  let category = "Clinical Laboratory Analysis";
  const textLower = rawText.toLowerCase();
  if (textLower.includes("cbc") || textLower.includes("complete blood count") || textLower.includes("hemogram")) {
    category = "Complete Blood Count (CBC)";
  } else if (textLower.includes("lipid") || textLower.includes("cholesterol")) {
    category = "Lipid Profile (Cardiovascular Panel)";
  } else if (textLower.includes("kft") || textLower.includes("rft") || textLower.includes("renal") || textLower.includes("kidney")) {
    category = "Renal & Kidney Function Panel";
  } else if (textLower.includes("lft") || textLower.includes("liver function")) {
    category = "Liver Function Panel";
  } else if (textLower.includes("thyroid") || textLower.includes("tsh")) {
    category = "Thyroid Function Panel";
  } else if (textLower.includes("glucose") || textLower.includes("sugar") || textLower.includes("diabetes")) {
    category = "Blood Glucose & Diabetes Panel";
  }

  const urgentFindings = detectedTests
    .filter((t) => t.flag === "High" || t.flag === "Critical" || t.flag === "Low")
    .map((t) => `${t.test_name} is reported as ${t.flag} (${t.reported_value} ${t.unit})`);

  let summaryOverview = "";
  if (detectedTests.length === 0) {
    summaryOverview = (lang === "te")
      ? "మెడికల్ డాక్యుమెంట్ గుర్తించబడింది, అయితే నిర్దిష్ట ల్యాబ్ రీడింగ్‌లు స్పష్టంగా లేవు. దయచేసి క్రింది స్కాన్ చేసిన టెక్స్ట్‌ను మీ వైద్యుడితో సమీక్షించండి."
      : (lang === "hi")
      ? "चिकित्सा दस्तावेज का पता चला, लेकिन व्यक्तिगत परीक्षण संख्याएं स्पष्ट नहीं थीं। कृपया नीचे दिए गए पाठ को अपने डॉक्टर के साथ देखें।"
      : "Medical document text was detected, but individual test readings could not be cleanly read from the image. Please review the raw extracted text below with your physician.";
  } else if (urgentFindings.length > 0) {
    summaryOverview = (lang === "te")
      ? `మీ ల్యాబ్ రిపోర్టులో ${detectedTests.length} పరీక్షలు గుర్తించబడ్డాయి. ${urgentFindings.length} కొలతలు సాధారణ పరిధి కంటే భిన్నంగా ఉన్నాయి. మీ వైద్యుడిని సంప్రదించండి.`
      : (lang === "hi")
      ? `आपकी लैब रिपोर्ट में ${detectedTests.length} परीक्षणों की पहचान की गई। ${urgentFindings.length} परिणाम सामान्य सीमा से बाहर हैं। कृपया अपने चिकित्सक से परामर्श करें।`
      : `Your lab report identified ${detectedTests.length} biomarker tests. ${urgentFindings.length} results deviate from standard reference ranges. Review these results with your physician.`;
  } else {
    summaryOverview = (lang === "te")
      ? `మీ ల్యాబ్ రిపోర్టులో ${detectedTests.length} పరీక్షలు విజయవంతంగా విశ్లేషించబడ్డాయి. అన్ని గుర్తింపు పొందిన కొలతలు సాధారణ పరిధిలోనే ఉన్నాయి.`
      : (lang === "hi")
      ? `आपकी लैब रिपोर्ट के ${detectedTests.length} परीक्षणों का सफलतापूर्वक विश्लेषण किया गया। सभी पहचाने गए परिणाम सामान्य सीमा के भीतर हैं।`
      : `Your lab report was successfully evaluated for ${detectedTests.length} biomarkers. All detected tests fall within standard normal ranges.`;
  }

  return {
    patientName,
    labName,
    reportDate,
    category,
    tests: detectedTests,
    urgentFindings,
    summaryOverview
  };
}

module.exports = {
  validateMedicalReportText,
  validatePrescriptionText,
  parseLabReportHeuristics,
  commonLabMarkers
};
