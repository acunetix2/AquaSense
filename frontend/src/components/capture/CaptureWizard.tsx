import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { Step1Location } from './Step1Location'
import { Step2Photo } from './Step2Photo'
import { Step3Assessment } from './Step3Assessment'
import { Step4Review } from './Step4Review'
import { uploadDataUriToStorage } from '../../lib/supabase'
import type { AssessmentAnswers, SignalType } from '../../types/observation'

export const CaptureWizard: React.FC = () => {
  const { addNewObservation, setActiveView, setSelectedObservation } = useApp()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  // Location state
  const [location, setLocation] = useState({
    site_name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    accuracy: 0,
  })

  // Image state – URLs for display, base64 data list for AI, mime type (up to 3 images)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imageDataList, setImageDataList] = useState<string[]>([])
  const [imageMime, setImageMime] = useState<string>('image/jpeg')

  const [answers, setAnswers] = useState<AssessmentAnswers>({
    waterClarity: 'clear',
    noticeableOdor: 'no',
    unusualColor: 'no',
    wasteVisible: false,
    flowRate: 'normal',
    additionalNotes: '',
  })

  const steps = [
    { num: 1, label: 'Location' },
    { num: 2, label: 'Photo' },
    { num: 3, label: 'Conditions' },
    { num: 4, label: 'AI Review' },
  ]

  const handleImageChange = (urls: string[], dataList: string[], mime: string) => {
    setImageUrls(urls)
    setImageDataList(dataList)
    setImageMime(mime)
  }

  const handleSaveObservation = async (calculated: {
    signal: SignalType
    confidence: number
    summary: string
    keyEvidence: string[]
    suggestedSteps: string[]
    aiResult: any
    consistencyAcknowledged: boolean
  }) => {
    // Persist any data: URI images (sample/URL captures) to the storage bucket
    // before saving — the API strips data URIs, so without this the photo is lost.
    const persistedUrls = await Promise.all(
      imageUrls.map((url, idx) => uploadDataUriToStorage(url, `capture-${idx + 1}.jpg`))
    )
    const finalImageUrls = persistedUrls
      .map((url, idx) => url || imageUrls[idx])
      .filter((url): url is string => Boolean(url))

    const created = await addNewObservation({
      site_name: location.site_name,
      location_address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      image_url: finalImageUrls[0] || '',
      image_urls: finalImageUrls,
      image_data_list: imageDataList,
      water_appearance: answers.waterClarity?.replace('_', ' ') || 'clear',
      odour: answers.noticeableOdor === 'yes' ? 'noticeable' : 'none',
      waste_visible: !!answers.wasteVisible,
      flow_rate: answers.flowRate || 'normal',
      notes: answers.additionalNotes || '',
      assessment_answers: {
        ...answers,
        ai_result: calculated.aiResult,
        // Observer explicitly confirmed their answer despite an AI consistency flag
        ...(calculated.consistencyAcknowledged
          ? { consistency_acknowledged: true }
          : {}),
      },
      signal: calculated.signal,
      confidence: calculated.confidence,
      ai_summary: calculated.summary,
      key_evidence: calculated.keyEvidence,
      suggested_steps: calculated.suggestedSteps,
      // Associate with authenticated user (email omitted from public API payload for privacy)
      user_id: user?.id,
      observer_name: user?.name,
      observer_avatar: user?.avatar_url,
      observer_location: user?.location || location.address || `${location.site_name}, NY`,
      observer_role: user?.role || 'citizen',
    })

    setSelectedObservation(created)
    setActiveView('detail')
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 space-y-8">
      {/* Step Progress Header */}
      <div className="flex items-center justify-between max-w-xl mx-auto px-4">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.num
          const isCompleted = currentStep > step.num

          return (
            <React.Fragment key={step.num}>
              <div
                onClick={() => {
                  if (isCompleted) setCurrentStep(step.num as any)
                }}
                className={`flex items-center gap-2 select-none group ${
                  isCompleted ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0284C7] text-white ring-4 ring-sky-100 shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check size={14} className="stroke-[3]" /> : step.num}
                </div>
                <span
                  className={`text-xs sm:text-sm font-semibold transition-colors hidden sm:block ${
                    isActive
                      ? 'text-[#0284C7]'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors duration-300 ${
                    currentStep > step.num ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 md:p-10 shadow-sm">
        {currentStep === 1 && (
          <Step1Location
            location={location}
            onChange={setLocation}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2Photo
            imageUrls={imageUrls}
            imageDataList={imageDataList}
            imageMime={imageMime}
            onChange={handleImageChange}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <Step3Assessment
            answers={answers}
            onChange={setAnswers}
            onBack={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <Step4Review
            location={location}
            imageUrls={imageUrls}
            imageDataList={imageDataList}
            imageMime={imageMime}
            answers={answers}
            onBack={() => setCurrentStep(3)}
            onSave={handleSaveObservation}
            onViewOnMap={() => setActiveView('map')}
          />
        )}
      </div>
    </div>
  )
}
