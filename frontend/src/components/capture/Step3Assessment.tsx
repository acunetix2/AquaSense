import React from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type {
  AssessmentAnswers,
  WaterClarity,
  NoticeableOdor,
  UnusualColor,
  FlowRate,
} from '../../types/observation'

interface Step3AssessmentProps {
  answers: AssessmentAnswers
  onChange: (answers: AssessmentAnswers) => void
  onBack: () => void
  onNext: () => void
}

export const Step3Assessment: React.FC<Step3AssessmentProps> = ({
  answers,
  onChange,
  onBack,
  onNext,
}) => {
  const update = <K extends keyof AssessmentAnswers>(key: K, val: AssessmentAnswers[K]) => {
    onChange({ ...answers, [key]: val })
  }

  const clarityOptions: { id: WaterClarity; label: string; desc: string }[] = [
    { id: 'clear', label: 'Clear', desc: 'Can see riverbed easily' },
    { id: 'slightly_cloudy', label: 'Slightly cloudy', desc: 'Mild haze or particles' },
    { id: 'cloudy', label: 'Cloudy', desc: 'Murky, limited visibility' },
    { id: 'very_cloudy', label: 'Very cloudy', desc: 'Opaque or dense silt' },
  ]

  const odorOptions: { id: NoticeableOdor; label: string }[] = [
    { id: 'no', label: 'No' },
    { id: 'yes', label: 'Yes' },
    { id: 'unsure', label: 'Unsure' },
  ]

  const colorOptions: { id: UnusualColor; label: string }[] = [
    { id: 'no', label: 'No' },
    { id: 'yes', label: 'Yes' },
    { id: 'unsure', label: 'Unsure' },
  ]

  const flowOptions: { id: FlowRate; label: string }[] = [
    { id: 'normal', label: 'Normal' },
    { id: 'fast', label: 'Fast / Torrential' },
    { id: 'low', label: 'Low' },
    { id: 'stagnant', label: 'Stagnant' },
  ]

  return (
    <div className="space-y-6">
      {/* Header matching inspiration.png Screen 4 */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Tell us about what you see</h2>
        <p className="text-sm text-slate-500 mt-1">
          Answer a few simple questions about the stream conditions.
        </p>
      </div>

      <div className="space-y-5">
        {/* Question 1: Water clarity */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Water clarity
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {clarityOptions.map((opt) => {
              const isSelected = answers.waterClarity === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update('waterClarity', opt.id)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0F4C81] bg-sky-50 ring-1 ring-[#0F4C81]'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isSelected ? 'text-[#0F4C81]' : 'text-slate-800'}`}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#0F4C81] flex items-center justify-center">
                        <Check size={10} className="text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 block">{opt.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Odor + Unusual color — side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Question 2: Noticeable odor? */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Noticeable odor?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {odorOptions.map((opt) => {
                const isSelected = answers.noticeableOdor === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update('noticeableOdor', opt.id)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0F4C81] bg-sky-50 text-[#0F4C81] ring-1 ring-[#0F4C81]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Question 3: Unusual color? */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Unusual color?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map((opt) => {
                const isSelected = answers.unusualColor === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => update('unusualColor', opt.id)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0F4C81] bg-sky-50 text-[#0F4C81] ring-1 ring-[#0F4C81]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Question 4: Waste visible */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Visible waste or debris?
          </label>
          <div className="grid grid-cols-2 gap-2 max-w-xs">
            <button
              type="button"
              onClick={() => update('wasteVisible', false)}
              className={`py-2 px-3 rounded-lg border text-sm font-medium text-center transition-all cursor-pointer ${
                answers.wasteVisible === false
                  ? 'border-[#0F4C81] bg-sky-50 text-[#0F4C81] ring-1 ring-[#0F4C81]'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              No waste
            </button>
            <button
              type="button"
              onClick={() => update('wasteVisible', true)}
              className={`py-2 px-3 rounded-lg border text-sm font-medium text-center transition-all cursor-pointer ${
                answers.wasteVisible === true
                  ? 'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-400'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              Debris visible
            </button>
          </div>
        </div>

        {/* Question 5: Flow rate */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Stream flow rate
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {flowOptions.map((opt) => {
              const isSelected = answers.flowRate === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update('flowRate', opt.id)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0F4C81] bg-sky-50 text-[#0F4C81] ring-1 ring-[#0F4C81]'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Question 6: Additional notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Additional notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={answers.additionalNotes || ''}
            onChange={(e) => update('additionalNotes', e.target.value)}
            rows={3}
            placeholder="Describe any other conditions: wildlife seen, water depth, weather, nearby activities, etc."
            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F4C81] focus:border-[#0F4C81] transition-all resize-none"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#0F4C81] hover:bg-[#0c3c66] transition-colors cursor-pointer"
        >
          Continue
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
