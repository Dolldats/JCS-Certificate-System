'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { templatesApi } from '../../../services/api';
import { CertificateTemplate, Auxiliary, CertificateType } from '../../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { CertificatePreview } from '../../../components/certificates/CertificatePreview';
import {
  Save,
  Check,
  Eye,
  Sliders,
  Sparkles,
  Palette,
  Layers,
  FileSignature,
  UploadCloud,
  X,
  ImagePlus,
} from 'lucide-react';

const CERTIFICATE_TYPES: CertificateType[] = [
  'Certificate of Participation',
  'Certificate of Merit',
  'Certificate of Excellence',
  'Certificate of Appreciation',
  'Certificate of Recognition',
  'Certificate of Attendance',
];

const COLOR_PRESETS = [
  { name: 'Atfal / Khuddam Green', primary: '#15803d', accent: '#84cc16', bg: '#ffffff' },
  { name: 'Royal Emerald & Gold', primary: '#046a38', accent: '#d97706', bg: '#fffbeb' },
  { name: 'Lajna Teal & Amber', primary: '#0f766e', accent: '#f59e0b', bg: '#f0fdfa' },
  { name: 'Navy & Bright Gold', primary: '#1e3a8a', accent: '#eab308', bg: '#eff6ff' },
  { name: 'Burgundy & Champagne', primary: '#991b1b', accent: '#d97706', bg: '#fff1f2' },
  { name: 'Classic Charcoal Slate', primary: '#1e293b', accent: '#64748b', bg: '#f8fafc' },
  { name: 'Soft Ivory Cream', primary: '#78350f', accent: '#d97706', bg: '#fef9c3' },
  { name: 'Midnight Purple', primary: '#5b21b6', accent: '#a78bfa', bg: '#faf5ff' },
];

export default function TemplatesPage() {
  const { user, activeAuxiliary } = useAuth();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [currentTemplate, setCurrentTemplate] = useState<CertificateTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'visuals' | 'content' | 'signatories'>('visuals');
  const [isDragActive, setIsDragActive] = useState(false);
  const [signatureError, setSignatureError] = useState('');
  const signatureInputRef = useRef<HTMLInputElement>(null);
  // Sample recipient — preview only (empty = blank handwriting lines).
  const [sampleName, setSampleName] = useState('');
  const [sampleDilla, setSampleDilla] = useState('');
  const [sampleJamaat, setSampleJamaat] = useState('');
  const [sampleMuqami, setSampleMuqami] = useState('');
  const [sampleVenue, setSampleVenue] = useState('');

  // One input per blank on the certificate, matching the original layout.
  // (Line 4 from/to auto-fill from "Program Duration & Dates".)
  const previewCertificate = {
    participantName: sampleName || undefined,
    dila: sampleDilla || undefined,
    ilaqa: sampleMuqami || undefined,
    jamaat: sampleJamaat || undefined,
    muqami: sampleMuqami || undefined,
    venue: sampleVenue || undefined,
  };

  const handleSignatureFile = useCallback(
    (file: File | undefined) => {
      if (!file || !currentTemplate) return;
      setSignatureError('');
      if (!file.type.startsWith('image/')) {
        setSignatureError('Please upload an image file (PNG, JPG, WEBP or SVG).');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setSignatureError('Image is too large. Max size is 2MB — use a cropped transparent PNG.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCurrentTemplate({ ...currentTemplate, signature1Image: dataUrl });
      };
      reader.onerror = () => setSignatureError('Could not read that file. Please try another image.');
      reader.readAsDataURL(file);
    },
    [currentTemplate]
  );

  const handleClearSignature = useCallback(() => {
    if (!currentTemplate) return;
    setCurrentTemplate({ ...currentTemplate, signature1Image: undefined });
    setSignatureError('');
    if (signatureInputRef.current) signatureInputRef.current.value = '';
  }, [currentTemplate]);

  useEffect(() => {
    async function loadTemplates() {
      const aux = activeAuxiliary === 'All' ? undefined : (activeAuxiliary as Auxiliary);
      const data = await templatesApi.getAll(aux);
      setTemplates(data);
      if (data.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(data[0].id);
        setCurrentTemplate({ ...data[0] });
      }
    }
    loadTemplates();
  }, [activeAuxiliary]);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = templates.find((t) => t.id === id);
    if (found) {
      setCurrentTemplate({ ...found });
    }
  };

  const handleSave = async () => {
    if (!currentTemplate || !user) return;
    setIsSaving(true);
    try {
      await templatesApi.save(currentTemplate, user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      const all = await templatesApi.getAll(
        activeAuxiliary === 'All' ? undefined : (activeAuxiliary as Auxiliary)
      );
      setTemplates(all);
    } catch (err) {
      console.error('Failed to save template', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Certificate Studio &amp; Design Editor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Edit text, customize 3D rings, change color themes, adjust signatories, and view live changes.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
        >
          {saveSuccess ? 'Saved to Templates!' : 'Save Template'}
        </Button>
      </div>

      {/* Template Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {templates.map((tmpl) => {
          const isSelected = tmpl.id === selectedTemplateId;
          return (
            <button
              key={tmpl.id}
              onClick={() => handleSelectTemplate(tmpl.id)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-white/50"
                style={{ backgroundColor: tmpl.primaryColor }}
              />
              <span>{tmpl.name}</span>
              {tmpl.auxiliary && <Badge auxiliary={tmpl.auxiliary as Auxiliary} />}
            </button>
          );
        })}
      </div>

      {/* Main Studio: Controls (Left) + Live Interactive Preview (Right) */}
      {currentTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Tab selector for editor */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('visuals')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'visuals'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Colors &amp; Style</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'content'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Text &amp; Theme</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signatories')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'signatories'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSignature className="w-3.5 h-3.5" />
                <span>Signatories</span>
              </button>
            </div>

            {/* TAB 1: VISUALS & COLORS */}
            {activeTab === 'visuals' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Color Theme &amp; Ornaments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preset Swatches */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Quick Color Palettes
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() =>
                            setCurrentTemplate({
                              ...currentTemplate,
                              primaryColor: preset.primary,
                              accentColor: preset.accent,
                              backgroundColor: preset.bg,
                            })
                          }
                          className="p-2 rounded-lg border border-slate-200 hover:border-slate-400 bg-slate-50/50 flex items-center gap-2 text-left cursor-pointer transition-colors"
                        >
                          <div className="flex -space-x-1 shrink-0">
                            <span
                              className="w-4 h-4 rounded-full border border-white"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-white"
                              style={{ backgroundColor: preset.accent }}
                            />
                            <span
                              className="w-4 h-4 rounded-full border-2 border-slate-300"
                              style={{ backgroundColor: preset.bg }}
                              title="Background"
                            />
                          </div>
                          <span className="text-3xs font-medium text-slate-700 truncate">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Hex Color Pickers */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <p className="text-xs font-semibold text-slate-700">Custom Colors</p>
                    <div className="grid grid-cols-1 gap-3">
                      {/* Primary Color */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Primary Color
                          <span className="ml-1.5 text-3xs font-normal text-slate-500">
                            (rings, badge, pill)
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentTemplate.primaryColor}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                primaryColor: e.target.value,
                              })
                            }
                            className="w-10 h-10 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={currentTemplate.primaryColor}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                primaryColor: e.target.value,
                              })
                            }
                            className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2"
                            placeholder="#15803d"
                          />
                          {/* Live swatch preview */}
                          <span
                            className="w-8 h-8 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: currentTemplate.primaryColor }}
                          />
                        </div>
                      </div>

                      {/* Accent Color */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Accent / Highlight Color
                          <span className="ml-1.5 text-3xs font-normal text-slate-500">
                            (gradients, highlights)
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentTemplate.accentColor}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                accentColor: e.target.value,
                              })
                            }
                            className="w-10 h-10 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={currentTemplate.accentColor}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                accentColor: e.target.value,
                              })
                            }
                            className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2"
                            placeholder="#84cc16"
                          />
                          <span
                            className="w-8 h-8 rounded-full border border-slate-300 shrink-0"
                            style={{ backgroundColor: currentTemplate.accentColor }}
                          />
                        </div>
                      </div>

                      {/* Background Color */}
                      <div className="p-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          🎨 Certificate Background Color
                          <span className="ml-1.5 text-3xs font-normal text-slate-500">
                            (paper / canvas fill)
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentTemplate.backgroundColor || '#ffffff'}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                backgroundColor: e.target.value,
                              })
                            }
                            className="w-10 h-10 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={currentTemplate.backgroundColor || '#ffffff'}
                            onChange={(e) =>
                              setCurrentTemplate({
                                ...currentTemplate,
                                backgroundColor: e.target.value,
                              })
                            }
                            className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2"
                            placeholder="#ffffff"
                          />
                          <span
                            className="w-8 h-8 rounded-full border-2 border-slate-400 shrink-0"
                            style={{ backgroundColor: currentTemplate.backgroundColor || '#ffffff' }}
                            title="Background preview"
                          />
                        </div>
                        {/* Quick background swatches */}
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {[
                            { hex: '#ffffff', label: 'White' },
                            { hex: '#fffbeb', label: 'Warm Cream' },
                            { hex: '#f0fdfa', label: 'Mint' },
                            { hex: '#eff6ff', label: 'Sky Blue' },
                            { hex: '#faf5ff', label: 'Lavender' },
                            { hex: '#fff1f2', label: 'Blush' },
                            { hex: '#fef9c3', label: 'Ivory' },
                            { hex: '#f0fdf4', label: 'Sage' },
                            { hex: '#0f172a', label: 'Dark' },
                          ].map((swatch) => (
                            <button
                              key={swatch.hex}
                              type="button"
                              title={swatch.label}
                              onClick={() =>
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  backgroundColor: swatch.hex,
                                })
                              }
                              className="w-6 h-6 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500"
                              style={{
                                backgroundColor: swatch.hex,
                                borderColor:
                                  currentTemplate.backgroundColor === swatch.hex
                                    ? '#15803d'
                                    : '#cbd5e1',
                                boxShadow:
                                  currentTemplate.backgroundColor === swatch.hex
                                    ? '0 0 0 2px #15803d'
                                    : 'none',
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-3xs text-slate-400 mt-1.5">
                          Tip: Use white for printing, or a soft tint for digital certificates.
                        </p>
                      </div>
                    </div>
                  </div>


                  {/* Decorative Elements Toggles */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      Graphic Elements
                    </span>

                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          3D Torus Rings (Top &amp; Bottom)
                        </span>
                        <span className="text-3xs text-slate-500">
                          Modern curved geometric arcs in corner borders
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={currentTemplate.showTorusRings}
                        onChange={(e) =>
                          setCurrentTemplate({
                            ...currentTemplate,
                            showTorusRings: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          Rosette Ribbon Badge (Bottom Left)
                        </span>
                        <span className="text-3xs text-slate-500">
                          Official serrated seal with notched hanging ribbons
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={currentTemplate.showRosetteBadge}
                        onChange={(e) =>
                          setCurrentTemplate({
                            ...currentTemplate,
                            showRosetteBadge: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 block">
                          Subtle Wave Guilloche Watermark
                        </span>
                        <span className="text-3xs text-slate-500">
                          Light security micro-curves in background
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={currentTemplate.showWaveWatermark}
                        onChange={(e) =>
                          setCurrentTemplate({
                            ...currentTemplate,
                            showWaveWatermark: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 2: CONTENT & TEXT */}
            {activeTab === 'content' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Certificate Headers &amp; Titles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <Input
                    label="Organization Name (Top Left)"
                    value={currentTemplate.organizationName}
                    onChange={(e) =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        organizationName: e.target.value,
                      })
                    }
                    placeholder="e.g. MAJLIS ATFAL-UL AHMADIYYA NIGERIA"
                  />

                  <Input
                    label="Organization Subtitle"
                    value={currentTemplate.organizationSubtitle}
                    onChange={(e) =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        organizationSubtitle: e.target.value,
                      })
                    }
                    placeholder="e.g. (Ahmadiyya Muslims Children Organization)"
                  />

                  <Input
                    label="Main Event Headline"
                    value={currentTemplate.eventTitle}
                    onChange={(e) =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        eventTitle: e.target.value,
                      })
                    }
                    placeholder="e.g. ISLAMIC VACATION COURSE/REGIONAL IJTEMA 2025"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Certificate Type"
                      value={currentTemplate.certificateType}
                      onChange={(e) => {
                        const newType = e.target.value as CertificateType;
                        setCurrentTemplate({
                          ...currentTemplate,
                          certificateType: newType,
                          typeBadgeText: newType.toUpperCase(),
                        });
                      }}
                      options={CERTIFICATE_TYPES.map((t) => ({ value: t, label: t }))}
                    />

                    <Input
                      label="Badge Pill Text"
                      value={currentTemplate.typeBadgeText}
                      onChange={(e) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          typeBadgeText: e.target.value,
                        })
                      }
                      placeholder="e.g. CERTIFICATE OF PARTICIPATION"
                    />
                  </div>

                  <Input
                    label="Theme Callout"
                    value={currentTemplate.themeTitle}
                    onChange={(e) =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        themeTitle: e.target.value,
                      })
                    }
                    placeholder="e.g. Theme: My Faith, My Identity."
                  />

                  <Input
                    label="Program Duration &amp; Dates"
                    value={currentTemplate.programDurationText}
                    onChange={(e) =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        programDurationText: e.target.value,
                      })
                    }
                    placeholder="e.g. 3rd August to Sunday 10th August, 2025"
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Focus &amp; Purpose Description
                    </label>
                    <textarea
                      value={currentTemplate.bodyFocusText}
                      onChange={(e) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          bodyFocusText: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* Sample recipient — fills the preview blanks */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Sample Recipient (preview only)</p>
                      <p className="text-3xs text-slate-500">
                        Type here to fill the live preview. Clear a field to show its blank line again. Not saved to the template.
                      </p>
                    </div>
                    <Input
                      label="Recipient Name (Tifl)"
                      value={sampleName}
                      onChange={(e) => setSampleName(e.target.value)}
                      placeholder="e.g. Kabeer Olasunkanmi"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Dilla"
                        value={sampleDilla}
                        onChange={(e) => setSampleDilla(e.target.value)}
                        placeholder="e.g. Lagos"
                      />
                      <Input
                        label="Jamaat (from)"
                        value={sampleJamaat}
                        onChange={(e) => setSampleJamaat(e.target.value)}
                        placeholder="e.g. Ilasamaja"
                      />
                    </div>
                    <Input
                      label="Muqami / Ilaqa"
                      value={sampleMuqami}
                      onChange={(e) => setSampleMuqami(e.target.value)}
                      placeholder="e.g. South West"
                    />
                    <Input
                      label="Venue (took place at)"
                      value={sampleVenue}
                      onChange={(e) => setSampleVenue(e.target.value)}
                      placeholder="e.g. Jamia Ahmadiyya Ilaro, Ogun State"
                    />
                    <p className="text-3xs text-slate-500">
                      Line 4&apos;s from/to fills automatically from Program Duration &amp; Dates above (split on “to”).
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 3: SIGNATORIES */}
            {activeTab === 'signatories' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Signatory &amp; Validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5">
                  <Input
                    label="Signatory Full Name"
                    value={currentTemplate.signature1Name}
                    onChange={(e) =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        signature1Name: e.target.value,
                      })
                    }
                    placeholder="e.g. Abdur Raob Akhryemi"
                  />

                  <Input
                    label="Signatory Official Title"
                    value={currentTemplate.signature1Title}
                    onChange={(e) =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        signature1Title: e.target.value,
                      })
                    }
                    placeholder="e.g. Sadr Majlis Khuddamul Ahmadiyya Nigeria"
                  />

                  <Input
                    label="Date of Signing"
                    value={currentTemplate.signature1Date}
                    onChange={(e) =>
                      setCurrentTemplate({
                        ...currentTemplate,
                        signature1Date: e.target.value,
                      })
                    }
                    placeholder="e.g. 10th August, 2025"
                  />

                  {/* Real signature image — drag & drop */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Real Signature Image
                      <span className="ml-1.5 text-3xs font-normal text-slate-500">
                        (replaces the default flourish)
                      </span>
                    </label>
                    <input
                      ref={signatureInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => handleSignatureFile(e.target.files?.[0])}
                    />
                    {currentTemplate.signature1Image ? (
                      <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-3">
                        <div className="w-32 h-14 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 px-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={currentTemplate.signature1Image}
                            alt="Uploaded signature"
                            className="max-h-12 max-w-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-900">
                            Real signature applied
                          </p>
                          <p className="text-3xs text-slate-500 truncate">
                            Shows on the live preview &amp; printed certificates.
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              type="button"
                              onClick={() => signatureInputRef.current?.click()}
                              className="text-3xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 cursor-pointer"
                            >
                              Replace
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={handleClearSignature}
                              className="text-3xs font-semibold text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              Remove (use default flourish)
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => signatureInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') signatureInputRef.current?.click();
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragActive(true);
                        }}
                        onDragLeave={() => setIsDragActive(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragActive(false);
                          handleSignatureFile(e.dataTransfer.files?.[0]);
                        }}
                        className={`p-5 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                          isDragActive
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-300 bg-slate-50/60 hover:border-emerald-400 hover:bg-emerald-50/40'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                            {isDragActive ? (
                              <UploadCloud className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ImagePlus className="w-5 h-5 text-slate-500" />
                            )}
                          </span>
                          <p className="text-xs font-semibold text-slate-700">
                            {isDragActive
                              ? 'Drop signature to upload'
                              : 'Drag & drop signature here, or click to browse'}
                          </p>
                          <p className="text-3xs text-slate-500">
                            Transparent PNG works best • JPG, WEBP, SVG • Max 2MB
                          </p>
                        </div>
                      </div>
                    )}
                    {signatureError && (
                      <p className="text-3xs text-rose-600 font-medium mt-1.5">{signatureError}</p>
                    )}
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-2xs text-emerald-950 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      {currentTemplate.signature1Image
                        ? 'Using your uploaded real signature. Remove it to fall back to the default cursive flourish.'
                        : 'No image yet — the certificate shows a default cursive flourish. Upload a real signature above to replace it. When issued, each certificate also receives a unique serial number and hash.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Live Preview Column (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <CardTitle>Live Preview (Instant WYSIWYG)</CardTitle>
                  </div>
                  <span className="text-3xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    Interactive Real-Time
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col items-center bg-slate-100/70 rounded-b-xl overflow-hidden">
                <CertificatePreview
                  certificate={previewCertificate}
                  template={currentTemplate}
                  previewMode={true}
                  showActions={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
