import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileCheck,
  Download,
  Trash2,
  Loader2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { uploadAndAnalyzeLabReport } from '../services/api';
import { getTranslation } from '../utils/translations';

export default function LabReportsManager({ lang = 'en' }) {
  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem('healthsaathi_saved_lab_reports') || localStorage.getItem('medimate_saved_lab_reports');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeReport, setActiveReport] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [expandedTestIdx, setExpandedTestIdx] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const fileInputRef = useRef(null);

  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const saveReportsToStorage = (updated) => {
    setReports(updated);
    try {
      localStorage.setItem('healthsaathi_saved_lab_reports', JSON.stringify(updated.slice(0, 15)));
    } catch (e) {
      console.warn('Storage limit reached:', e);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess('');

    // Validation: Allowed types
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      setUploadError({
        message: 'Unsupported file type. Please upload a PDF document or a clear JPG/PNG image.',
        errorType: 'INVALID_TYPE'
      });
      return;
    }

    // Validation: Max size 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError({
        message: 'File exceeds 10MB limit. Please upload a compressed PDF or image.',
        errorType: 'FILE_TOO_LARGE'
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess('');

    try {
      const response = await uploadAndAnalyzeLabReport(selectedFile, lang);

      if (!response.success) {
        throw new Error(response.message || 'Analysis could not be completed.');
      }

      const newReportEntry = {
        id: 'rep-' + Date.now(),
        fileName: response.fileName || selectedFile.name,
        fileSize: (selectedFile.size / 1024).toFixed(1) + ' KB',
        fileType: selectedFile.type,
        uploadedAt: new Date().toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        data: response.data,
        disclaimer: response.disclaimer,
        rawSnippet: response.extracted_text_preview
      };

      const updated = [newReportEntry, ...reports];
      saveReportsToStorage(updated);
      setActiveReport(newReportEntry);
      setUploadSuccess(`Lab report "${selectedFile.name}" analyzed successfully!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError({
        message: err.message || 'Failed to process lab report. Please check file legibility.',
        errorType: err.errorType || 'ERROR',
        preview: err.preview || null,
        suggestion: err.suggestion || null
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteReport = (id) => {
    const updated = reports.filter((r) => r.id !== id);
    saveReportsToStorage(updated);
    if (activeReport?.id === id) {
      setActiveReport(updated[0] || null);
    }
  };

  const handleClearAllReports = () => {
    if (window.confirm('Clear all saved lab report history from this browser?')) {
      saveReportsToStorage([]);
      setActiveReport(null);
    }
  };

  const handleLoadSampleReport = () => {
    const sampleEntry = {
      id: 'rep-sample-' + Date.now(),
      fileName: 'Apollo_Diagnostics_CBC_Lipid_Panel.pdf',
      fileSize: '142.5 KB',
      fileType: 'application/pdf',
      uploadedAt: new Date().toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      data: {
        report_metadata: {
          patient_name: 'Deepika Kuruva',
          laboratory_name: 'Apollo Diagnostics & Pathology',
          report_date: new Date().toLocaleDateString(),
          test_category: 'Complete Blood Count (CBC) & Lipid Profile'
        },
        tests: [
          {
            test_name: 'Hemoglobin (Hb)',
            reported_value: '10.8',
            unit: 'g/dL',
            reference_range: '12.0 - 15.5 g/dL',
            flag: 'Low',
            plain_explanation: lang === 'te'
              ? 'శరీర కణజాలాలకు ఆక్సిజన్‌ను మోసుకెళ్ళే ఎర్ర రక్త కణాల్లోని ప్రోటీన్ సాధారణం కంటే తక్కువగా ఉంది. ఇది రక్తహీనత లేదా అలసటను కలిగించవచ్చు.'
              : lang === 'hi'
              ? 'लाल रक्त कोशिकाओं में हीमोग्लोबिन स्तर सामान्य से कम है। यह एनीमिया या थकान का कारण बन सकता है।'
              : 'Hemoglobin is below the standard reference range. This may indicate mild anemia or low iron stores, which can cause fatigue.',
            doctor_questions: [
              'Does this hemoglobin level warrant serum ferritin or iron profile testing?',
              'What dietary or iron supplementation adjustments are recommended?'
            ]
          },
          {
            test_name: 'Total Leukocyte Count (WBC)',
            reported_value: '7,400',
            unit: 'cells/cumm',
            reference_range: '4,000 - 11,000 cells/cumm',
            flag: 'Normal',
            plain_explanation: lang === 'te'
              ? 'మీ తెల్ల రక్త కణాల సంఖ్య సాధారణ పరిధిలోనే ఉంది. రోగనిరోధక రక్షణ స్థిరంగా ఉంది.'
              : lang === 'hi'
              ? 'आपकी श्वेत रक्त कोशिकाओं की संख्या सामान्य सीमा में है। प्रतिरक्षा प्रणाली संतुलित है।'
              : 'Your white blood cell count is within the healthy reference range, indicating normal immune activity.',
            doctor_questions: [
              'Are any follow-up tests needed for my white blood cell count?'
            ]
          },
          {
            test_name: 'Platelet Count',
            reported_value: '265,000',
            unit: 'cells/cumm',
            reference_range: '150,000 - 450,000 cells/cumm',
            flag: 'Normal',
            plain_explanation: lang === 'te'
              ? 'రక్తం గడ్డకట్టడానికి అవసరమైన ప్లేట్‌లెట్స్ సంఖ్య సాధారణ పరిధిలో ఉంది.'
              : lang === 'hi'
              ? 'रक्त का थक्का जमाने वाली प्लेटलेट्स की संख्या पूरी तरह सामान्य है।'
              : 'Platelet count is optimal for healthy clotting and tissue healing.',
            doctor_questions: [
              'Is my platelet level stable?'
            ]
          },
          {
            test_name: 'Fasting Blood Sugar (FBS)',
            reported_value: '118',
            unit: 'mg/dL',
            reference_range: '70 - 99 mg/dL',
            flag: 'High',
            plain_explanation: lang === 'te'
              ? 'ఉపవాస రక్త చక్కెర స్థాయి 99 mg/dL కంటే ఎక్కువగా ఉంది. ఇది ప్రీ-డయాబెటిస్ లేదా ప్రారంభ ఇన్సులిన్ అసమతుల్యతను సూచించవచ్చు.'
              : lang === 'hi'
              ? 'फास्टिंग ब्लड शुगर 99 mg/dL से अधिक है। यह प्रीडायबिटीज या इंसुलिन असंतुलन का संकेत हो सकता है।'
              : 'Fasting blood glucose is above the 99 mg/dL threshold. This commonly reflects impaired fasting glucose or early prediabetes.',
            doctor_questions: [
              'Should we order an HbA1c test to assess 3-month average glucose?',
              'What nutrition or exercise steps will bring this back into the normal 70-99 range?'
            ]
          },
          {
            test_name: 'Total Cholesterol',
            reported_value: '218',
            unit: 'mg/dL',
            reference_range: '< 200 mg/dL',
            flag: 'High',
            plain_explanation: lang === 'te'
              ? 'మొత్తం కొలెస్ట్రాల్ సిఫార్సు చేయబడిన 200 mg/dL పరిమితి కంటే కాస్త ఎక్కువగా ఉంది.'
              : lang === 'hi'
              ? 'कुल कोलेस्ट्रॉल 200 mg/dL की अनुशंसित सीमा से थोड़ा अधिक है।'
              : 'Total blood cholesterol is slightly elevated above the ideal 200 mg/dL benchmark.',
            doctor_questions: [
              'How does this total cholesterol reading affect my cardiovascular health profile?',
              'Are lifestyle changes sufficient before considering lipid therapy?'
            ]
          },
          {
            test_name: 'HDL Cholesterol (Good)',
            reported_value: '49',
            unit: 'mg/dL',
            reference_range: '40 - 60 mg/dL',
            flag: 'Normal',
            plain_explanation: lang === 'te'
              ? 'ధమనులను రక్షించే మంచి కొలెస్ట్రాల్ (HDL) సాధారణ ఆరోగ్యకరమైన పరిధిలో ఉంది.'
              : lang === 'hi'
              ? 'सुरक्षात्मक अच्छा कोलेस्ट्रॉल (HDL) सामान्य स्वस्थ सीमा में है।'
              : 'Protective HDL cholesterol is in the healthy range, helping clear arterial fats.',
            doctor_questions: [
              'What aerobic activities can help optimize my HDL level?'
            ]
          },
          {
            test_name: 'LDL Cholesterol (Bad)',
            reported_value: '136',
            unit: 'mg/dL',
            reference_range: '< 100 mg/dL',
            flag: 'High',
            plain_explanation: lang === 'te'
              ? 'చెడు కొలెస్ట్రాల్ (LDL) 100 mg/dL కంటే ఎక్కువగా ఉంది. ఆహారంలో కొవ్వులు తగ్గించడం మరియు నడక మంచిది.'
              : lang === 'hi'
              ? 'खराब कोलेस्ट्रॉल (LDL) 100 mg/dL से अधिक है। इसे नियंत्रित रखने के लिए आहार में बदलाव करें।'
              : 'LDL cholesterol is elevated above the 100 mg/dL target. Healthy fats, dietary fiber, and regular cardio help lower this.',
            doctor_questions: [
              'What should be my personal LDL target based on family history?',
              'Should we repeat lipid profile in 3 months?'
            ]
          },
          {
            test_name: 'Serum Creatinine',
            reported_value: '0.85',
            unit: 'mg/dL',
            reference_range: '0.6 - 1.2 mg/dL',
            flag: 'Normal',
            plain_explanation: lang === 'te'
              ? 'కిడ్నీల పనితీరును తెలిపే సీరమ్ క్రియాటినిన్ సాధారణ పరిధిలోనే ఉంది.'
              : lang === 'hi'
              ? 'किडनी के स्वास्थ्य को दर्शाने वाला सीरम क्रिएटिनिन पूरी तरह सामान्य है।'
              : 'Creatinine is in the normal range, indicating healthy renal waste clearance.',
            doctor_questions: [
              'Does my kidney filtration rate look optimal?'
            ]
          }
        ],
        urgent_findings: [
          'Fasting Blood Sugar (FBS) is marked High (118 mg/dL)',
          'LDL Cholesterol is marked High (136 mg/dL)'
        ],
        summary_overview: lang === 'te'
          ? 'మీ నమూనా ల్యాబ్ రిపోర్టులో 8 పరీక్షలు విశ్లేషించబడ్డాయి. రక్తంలో చక్కెర మరియు LDL కొలెస్ట్రాల్ కొద్దిగా పెరిగాయి, మిగిలిన కొలతలు సాధారణంగా ఉన్నాయి.'
          : lang === 'hi'
          ? 'आपकी नमूना लैब रिपोर्ट में 8 परीक्षणों का विश्लेषण किया गया। फास्टिंग शुगर और एलडीएल कोलेस्ट्रॉल थोड़े बढ़े हुए हैं, शेष सामान्य हैं।'
          : 'Your diagnostic panel evaluated 8 key biomarkers. Fasting blood glucose (118 mg/dL) and LDL cholesterol (136 mg/dL) are elevated, while blood counts and kidney filtration are normal.'
      },
      disclaimer: 'Laboratory reference ranges vary across instruments. Review with your physician.',
      rawSnippet: 'Apollo Diagnostics & Pathology. Patient: Deepika Kuruva. CBC & Lipid Panel: Hemoglobin 10.8 g/dL (12-15.5), TLC 7400 cells/cumm, Platelets 265000 cells/cumm, Fasting Blood Sugar 118 mg/dL (70-99), Total Cholesterol 218 mg/dL (<200), HDL 49 mg/dL (40-60), LDL 136 mg/dL (<100), Serum Creatinine 0.85 mg/dL (0.6-1.2).'
    };

    const updated = [sampleEntry, ...reports];
    saveReportsToStorage(updated);
    setActiveReport(sampleEntry);
    setUploadSuccess('Loaded sample diagnostic lab report (CBC & Lipid Panel)!');
    setUploadError(null);
  };

  const getFlagColor = (flag) => {
    const f = (flag || '').toLowerCase();
    if (f.includes('critical') || f.includes('panic')) return '#f43f5e';
    if (f.includes('high')) return '#f59e0b';
    if (f.includes('low')) return '#38bdf8';
    return '#10b981';
  };

  return (
    <div className="view-panel" id="lab-reports-section" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Section Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <FileText className="section-title-icon" size={24} />
            {t('lab_reports_title', 'Clinical Diagnostic Lab Reports')}
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px' }}>
            {t('lab_reports_subtitle', 'Upload blood tests, metabolic panels & pathology reports for plain-language explanations.')}
          </p>
        </div>
      </div>

      {/* Grid: Upload Card & Past Reports List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Card 1: Upload Dropzone */}
        <div className="card-container">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#06b6d4" />
            <span>Upload New Report</span>
          </h3>

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(6, 182, 212, 0.35)',
              borderRadius: '14px',
              padding: '1.75rem 1rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(6, 182, 212, 0.03)',
              transition: 'var(--transition)'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,image/png,image/jpeg,image/jpg"
              style={{ display: 'none' }}
              id="lab-report-file-input"
            />
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.12)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22d3ee',
                marginBottom: '10px'
              }}
            >
              <FileCheck size={24} />
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
              {selectedFile ? selectedFile.name : 'Click to select PDF or Image report'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
              Supports PDF, PNG, JPG (Maximum 10 MB)
            </div>
          </div>

          {selectedFile && (
            <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                Size: {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
              <button
                id="btn-analyze-report"
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={isUploading}
                style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Analyzing Report...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Generate Plain-Language Explanation</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleLoadSampleReport}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.42rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="Test with verified CBC & Lipid profile sample data"
            >
              <Sparkles size={14} color="#06b6d4" />
              <span>Try Sample Lab Report</span>
            </button>
          </div>

          {uploadError && (
            <div
              style={{
                marginTop: '0.85rem',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                fontSize: '0.82rem'
              }}
            >
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#f87171' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: '3px' }}>
                    {uploadError?.errorType === 'NOT_A_LAB_REPORT'
                      ? 'Uploaded File is Not a Medical Lab Report'
                      : 'Report Processing Notice'}
                  </div>
                  <div>{typeof uploadError === 'string' ? uploadError : uploadError.message}</div>

                  {uploadError?.preview && (
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px 10px',
                        background: 'rgba(0, 0, 0, 0.35)',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        lineHeight: 1.4
                      }}
                    >
                      <strong style={{ color: '#cbd5e1' }}>Detected text from your file:</strong>
                      <div style={{ fontStyle: 'italic', marginTop: '3px', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                        "{uploadError.preview}"
                      </div>
                    </div>
                  )}

                  {uploadError?.suggestion && (
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#38bdf8' }}>
                      💡 {uploadError.suggestion}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div
              style={{
                marginTop: '0.85rem',
                padding: '0.75rem 0.9rem',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#6ee7b7',
                fontSize: '0.8rem',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <CheckCircle2 size={16} />
              <div>{uploadSuccess}</div>
            </div>
          )}
        </div>

        {/* Card 2: Saved Reports Vault */}
        <div className="card-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#8b5cf6" />
              <span>Report History ({reports.length})</span>
            </h3>
            {reports.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllReports}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                title="Clear all stored reports"
              >
                Clear History
              </button>
            )}
          </div>

          {reports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.82rem' }}>
              No lab reports analyzed yet. Upload your first blood panel or metabolic report to begin.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '220px', overflowY: 'auto' }}>
              {reports.map((rep) => {
                const isSelected = activeReport?.id === rep.id;
                return (
                  <div
                    key={rep.id}
                    onClick={() => setActiveReport(rep)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                        {rep.fileName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {rep.uploadedAt} • {rep.data?.tests?.length || 0} tests identified
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(rep.id);
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#fda4af', cursor: 'pointer', padding: '4px' }}
                        title="Delete record securely"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Structured Lab Analysis View (When a report is active) */}
      {activeReport ? (
        <div className="card-container" id="active-lab-report-analysis" style={{ animation: 'modal-pop 0.25s ease-out' }}>
          {/* Metadata Banner */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '12px'
            }}
          >
            <div>
              <span className="brand-badge" style={{ marginBottom: '6px', display: 'inline-block' }}>
                {activeReport.data?.report_metadata?.test_category || 'Laboratory Analysis'}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {activeReport.fileName}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Lab: {activeReport.data?.report_metadata?.laboratory_name || 'Clinical Diagnostics'} • Date: {activeReport.data?.report_metadata?.report_date || activeReport.uploadedAt}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
                onClick={() => {
                  const blob = new Blob([JSON.stringify(activeReport, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${activeReport.fileName}_summary.json`;
                  a.click();
                }}
              >
                <Download size={14} />
                <span>Export Summary</span>
              </button>
            </div>
          </div>

          {/* Urgent Findings Alert (if any biomarker is flagged critical/high) */}
          {activeReport.data?.urgent_findings && activeReport.data.urgent_findings.length > 0 && (
            <div
              style={{
                margin: '1rem 0',
                padding: '0.85rem 1.1rem',
                borderRadius: '12px',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}
            >
              <ShieldAlert size={20} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fda4af' }}>
                  Attention: Potentially Urgent Clinical Finding
                </div>
                <div style={{ fontSize: '0.78rem', color: '#e2e8f0', marginTop: '2px' }}>
                  {activeReport.data.urgent_findings.join('. ')}.
                  Prompt clinical assessment with your physician is advised. This is an informational flag, not a definitive diagnosis.
                </div>
              </div>
            </div>
          )}

          {/* Compassionate Summary Overview */}
          {activeReport.data?.summary_overview && (
            <div
              style={{
                margin: '1rem 0',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                fontSize: '0.85rem',
                color: '#e2e8f0'
              }}
            >
              <strong style={{ color: '#22d3ee' }}>Summary Overview: </strong>
              {activeReport.data.summary_overview}
            </div>
          )}

          {/* Biomarkers Table & Expandable Explanations */}
          <div style={{ marginTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.75rem' }}>
              Extracted Biomarkers & Reference Evaluation
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeReport.data?.tests?.map((test, idx) => {
                const isExpanded = expandedTestIdx === idx;
                const flagColor = getFlagColor(test.flag);

                return (
                  <div
                    key={idx}
                    style={{
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isExpanded ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                      overflow: 'hidden',
                      transition: 'var(--transition)'
                    }}
                  >
                    {/* Header Row */}
                    <div
                      onClick={() => setExpandedTestIdx(isExpanded ? null : idx)}
                      style={{
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        gap: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff' }}>
                          {test.test_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                          Lab Reference Range: <span style={{ color: '#cbd5e1' }}>{test.reference_range}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Reported Result */}
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                            {test.reported_value}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '4px' }}>
                            {test.unit}
                          </span>
                        </div>

                        {/* Status Tag */}
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            background: `${flagColor}20`,
                            color: flagColor,
                            border: `1px solid ${flagColor}40`
                          }}
                        >
                          {test.flag || 'Normal'}
                        </span>

                        {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                      </div>
                    </div>

                    {/* Expanded Plain-Language Explanation & Doctor Questions */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: '1rem',
                          background: 'rgba(0, 0, 0, 0.25)',
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                        }}
                      >
                        <div style={{ marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase' }}>
                            What This Result Means:
                          </span>
                          <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '3px', lineHeight: 1.5 }}>
                            {test.plain_explanation}
                          </p>
                        </div>

                        {test.doctor_questions && test.doctor_questions.length > 0 && (
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <HelpCircle size={13} />
                              Suggested Questions for Your Doctor:
                            </span>
                            <ul style={{ margin: '4px 0 0 1rem', padding: 0, fontSize: '0.8rem', color: '#cbd5e1' }}>
                              {test.doctor_questions.map((q, qIdx) => (
                                <li key={qIdx} style={{ margin: '3px 0' }}>
                                  {q}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transparent Document OCR Snippet (Collapsible) */}
          {activeReport.rawSnippet && (
            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 0',
                  fontWeight: 600
                }}
              >
                <FileText size={14} />
                <span>{showRawText ? 'Hide Scanned Document Text' : 'View Scanned Document Text (OCR)'}</span>
                {showRawText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showRawText && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px 14px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.76rem',
                    color: '#94a3b8',
                    lineHeight: 1.5,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace'
                  }}
                >
                  {activeReport.rawSnippet}
                </div>
              )}
            </div>
          )}

          {/* Laboratory Range Disclaimer */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.75rem',
              color: '#94a3b8',
              lineHeight: 1.45
            }}
          >
            <strong>Laboratory Methodology Disclaimer: </strong>
            Reference ranges vary significantly across diagnostic instruments, reagents, and regional clinical laboratories.
            Never initiate, alter, or discontinue medical treatment independently. Always review these results directly with your physician.
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: '#94a3b8'
          }}
        >
          <FileText size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>No Report Selected</h4>
          <p style={{ fontSize: '0.82rem', maxWidth: '420px', margin: '6px auto 0' }}>
            Upload a laboratory report file above to see test-by-test plain explanations and personalized questions for your doctor.
          </p>
        </div>
      )}
    </div>
  );
}
