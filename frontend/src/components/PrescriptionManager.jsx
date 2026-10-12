import React, { useState, useRef } from 'react';
import {
  Pill,
  Upload,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
  Download,
  Loader2,
  ShieldAlert,
  Info,
  Sparkles,
  Search
} from 'lucide-react';
import { uploadAndAnalyzePrescription, fetchDrugInfo } from '../services/api';
import { getTranslation } from '../utils/translations';

export default function PrescriptionManager({ lang = 'en' }) {
  const [prescriptions, setPrescriptions] = useState(() => {
    try {
      const saved = localStorage.getItem('healthsaathi_saved_prescriptions') || localStorage.getItem('medimate_saved_prescriptions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activePrescription, setActivePrescription] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [selectedDrugFda, setSelectedDrugFda] = useState(null);
  const [fdaLoading, setFdaLoading] = useState(false);
  const fileInputRef = useRef(null);

  const t = (key, fallback) => getTranslation(lang, key, fallback);

  const savePrescriptionsToStorage = (updated) => {
    setPrescriptions(updated);
    try {
      localStorage.setItem('healthsaathi_saved_prescriptions', JSON.stringify(updated.slice(0, 15)));
    } catch (e) {
      console.warn('Storage quota note:', e);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      setUploadError('Unsupported file type. Please upload a PDF or JPG/PNG image of the prescription.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const response = await uploadAndAnalyzePrescription(selectedFile, lang);

      if (!response.success) {
        throw new Error(response.message || 'Prescription analysis could not be completed.');
      }

      const newEntry = {
        id: 'rx-' + Date.now(),
        fileName: response.fileName || selectedFile.name,
        uploadedAt: new Date().toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        data: response.data,
        disclaimer: response.disclaimer,
        rawSnippet: response.extracted_text_preview
      };

      const updated = [newEntry, ...prescriptions];
      savePrescriptionsToStorage(updated);
      setActivePrescription(newEntry);
      setUploadSuccess(`Prescription "${selectedFile.name}" analyzed successfully!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError(err.message || 'Could not parse prescription. Please ensure photo is clear.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id) => {
    const updated = prescriptions.filter((p) => p.id !== id);
    savePrescriptionsToStorage(updated);
    if (activePrescription?.id === id) {
      setActivePrescription(updated[0] || null);
    }
  };

  const handleLookupDrug = async (drugName) => {
    setFdaLoading(true);
    setSelectedDrugFda(null);
    try {
      const data = await fetchDrugInfo(drugName);
      setSelectedDrugFda(data);
    } catch (e) {
      console.warn('Drug lookup note:', e);
    } finally {
      setFdaLoading(false);
    }
  };

  return (
    <div className="view-panel" id="prescriptions-manager-section" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Section Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Pill className="section-title-icon" size={24} />
            {t('prescriptions_title', 'Prescription Reader & Medication Guidance')}
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px' }}>
            {t('prescriptions_subtitle', 'Digitize prescription slips, identify medicines, and inspect official drug labeling.')}
          </p>
        </div>
      </div>

      {/* Safety Banner */}
      <div
        style={{
          marginBottom: '1.25rem',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        <ShieldAlert size={20} color="#f43f5e" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.78rem', color: '#fda4af', lineHeight: 1.45 }}>
          <strong>Critical Medication Safety Mandate: </strong>
          Never independently modify your prescribed dosage, skip doses, or discontinue medication without direct guidance from your prescribing physician.
          If any medicine name or frequency is marked unclear below, verify it with your pharmacist before taking.
        </div>
      </div>

      {/* Upload & History Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Card 1: Upload Dropzone */}
        <div className="card-container">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#06b6d4" />
            <span>Upload Prescription Document</span>
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
              id="prescription-file-input"
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
              <Pill size={24} />
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
              {selectedFile ? selectedFile.name : 'Select Doctor Prescription (PDF / Photo)'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
              Supports PDF, PNG, JPG scans (Up to 10 MB)
            </div>
          </div>

          {selectedFile && (
            <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
              <button
                id="btn-analyze-prescription"
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={isUploading}
                style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Extracting Medications...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Extract Prescription Details</span>
                  </>
                )}
              </button>
            </div>
          )}

          {uploadError && (
            <div
              style={{
                marginTop: '0.85rem',
                padding: '0.75rem 0.9rem',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fca5a5',
                fontSize: '0.8rem',
                display: 'flex',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{uploadError}</div>
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

        {/* Card 2: Saved Prescriptions Vault */}
        <div className="card-container">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#8b5cf6" />
            <span>Prescription Records ({prescriptions.length})</span>
          </h3>

          {prescriptions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.82rem' }}>
              No prescriptions saved yet. Upload a prescription slip to extract medicines and view guidance.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '220px', overflowY: 'auto' }}>
              {prescriptions.map((p) => {
                const isSelected = activePrescription?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setActivePrescription(p)}
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
                        {p.fileName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {p.uploadedAt} • {p.data?.medicines?.length || 0} medications
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#fda4af', cursor: 'pointer', padding: '4px' }}
                      title="Delete prescription securely"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active Prescription Structured Breakdown */}
      {activePrescription ? (
        <div className="card-container" id="active-prescription-details" style={{ animation: 'modal-pop 0.25s ease-out' }}>
          {/* Header */}
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
                Prescription Record
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {activePrescription.fileName}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Doctor: {activePrescription.data?.doctor_info?.doctor_name || 'Prescribing Physician'} • Clinic: {activePrescription.data?.doctor_info?.clinic_or_hospital || 'Medical Clinic'}
              </p>
            </div>

            <button
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
              onClick={() => {
                const blob = new Blob([JSON.stringify(activePrescription, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${activePrescription.fileName}_medications.json`;
                a.click();
              }}
            >
              <Download size={14} />
              <span>Export Record</span>
            </button>
          </div>

          {/* Medicines Grid */}
          <div style={{ marginTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.75rem' }}>
              Extracted Medications & Regimen
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {activePrescription.data?.medicines?.map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: '12px',
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: med.is_uncertain ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Medicine Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                        {med.name}
                      </div>
                      {med.is_uncertain && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '999px',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#fcd34d',
                            border: '1px solid rgba(245, 158, 11, 0.4)'
                          }}
                        >
                          Confirm with Pharmacist
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>
                        <strong style={{ color: '#94a3b8' }}>Strength: </strong>
                        {med.strength || 'As printed'}
                      </div>
                      <div>
                        <strong style={{ color: '#94a3b8' }}>Dosage & Frequency: </strong>
                        {med.dosage_frequency || 'As prescribed'}
                      </div>
                      <div>
                        <strong style={{ color: '#94a3b8' }}>Timing / Instructions: </strong>
                        {med.timing || 'Follow doctor directions'}
                      </div>
                      {med.duration && (
                        <div>
                          <strong style={{ color: '#94a3b8' }}>Duration: </strong>
                          {med.duration}
                        </div>
                      )}
                    </div>

                    {/* Uncertainty Note if present */}
                    {med.is_uncertain && med.uncertainty_note && (
                      <div
                        style={{
                          marginTop: '0.65rem',
                          padding: '0.5rem 0.65rem',
                          borderRadius: '8px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          fontSize: '0.72rem',
                          color: '#fde68a',
                          display: 'flex',
                          gap: '6px',
                          alignItems: 'center'
                        }}
                      >
                        <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                        <span>{med.uncertainty_note}</span>
                      </div>
                    )}

                    {/* openFDA General Knowledge */}
                    {med.openfda_general_info && (
                      <div style={{ marginTop: '0.65rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                        <Info size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {med.openfda_general_info}
                      </div>
                    )}
                  </div>

                  {/* openFDA Deep Lookup Trigger */}
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleLookupDrug(med.name)}
                      style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem', width: '100%', justifyContent: 'center' }}
                    >
                      <Search size={12} />
                      <span>Lookup Official openFDA Drug Info</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* openFDA Lookup Modal / Panel */}
          {fdaLoading && (
            <div style={{ margin: '1rem 0', padding: '0.85rem', textAlign: 'center', color: '#06b6d4', fontSize: '0.82rem' }}>
              <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: '6px' }} />
              Querying official openFDA drug registry...
            </div>
          )}

          {selectedDrugFda && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                animation: 'modal-pop 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#22d3ee' }}>
                  openFDA Official Drug Labeling: {selectedDrugFda.brand_name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDrugFda(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Close
                </button>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                <p><strong>Primary Indication: </strong>{selectedDrugFda.purpose}</p>
                <p style={{ marginTop: '4px' }}><strong>Warnings / Precautions: </strong>{selectedDrugFda.warnings}</p>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
                {selectedDrugFda.disclaimer}
              </div>
            </div>
          )}

          {/* Doctor General Advice */}
          {activePrescription.data?.doctor_general_advice && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                fontSize: '0.82rem',
                color: '#e2e8f0'
              }}
            >
              <strong style={{ color: '#c084fc' }}>Doctor Advice & Notes: </strong>
              {activePrescription.data.doctor_general_advice}
            </div>
          )}
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
          <Pill size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>No Prescription Selected</h4>
          <p style={{ fontSize: '0.82rem', maxWidth: '420px', margin: '6px auto 0' }}>
            Upload a doctor's prescription slip above to extract structured medication timings and cross-check drug information.
          </p>
        </div>
      )}
    </div>
  );
}
