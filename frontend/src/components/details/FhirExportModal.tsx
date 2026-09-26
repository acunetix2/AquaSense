import React, { useState } from 'react'
import {
  X,
  Copy,
  Check,
  FileCode,
  Share2,
  QrCode,
  Download,
  MessageCircle,
  Send,
  Camera,
  Smartphone,
} from 'lucide-react'
import type { Observation } from '../../types/observation'
import { mapToFhirObservation } from '../../services/fhir'

const LinkedinIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.85 6.28a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
  </svg>
)

const TwitterIcon = () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

interface FhirExportModalProps {
  observation: Observation
  onClose: () => void
}

export const FhirExportModal: React.FC<FhirExportModalProps> = ({
  observation,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'qr' | 'fhir'>('share')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedInstagram, setCopiedInstagram] = useState(false)
  const [copiedFhir, setCopiedFhir] = useState(false)

  // Real deep link URL
  const shareUrl = `${window.location.origin}/#observation-${observation.id}`
  const fhirData = JSON.stringify(mapToFhirObservation(observation), null, 2)

  // Real QR Code API URL (free, high-res, reliable API)
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
    shareUrl
  )}`

  const shareTitle = `Water Observation: ${observation.site_name} on AquaSense`
  const shareText = `Check out this stream observation at ${observation.site_name} (Status: ${observation.signal.toUpperCase()}, Water Clarity Assessment) on AquaSense.`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleCopyFhir = () => {
    navigator.clipboard.writeText(fhirData)
    setCopiedFhir(true)
    setTimeout(() => setCopiedFhir(false), 2500)
  }

  // Social sharing handlers
  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText}\n\n${shareUrl}`
    )}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareUrl
    )}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleShareReddit = () => {
    const url = `https://reddit.com/submit?url=${encodeURIComponent(
      shareUrl
    )}&title=${encodeURIComponent(shareTitle)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleShareInstagram = () => {
    navigator.clipboard.writeText(`${shareUrl} #AquaSense #CleanWater #StreamWatch`)
    setCopiedInstagram(true)
    setTimeout(() => setCopiedInstagram(false), 3500)
    // Instagram does not have a direct web post URL; offer to open instagram.com
    window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink()
    }
  }

  const handleDownloadQr = () => {
    const link = document.createElement('a')
    link.href = qrCodeApiUrl
    link.download = `aquasense-observation-${observation.id}-qr.png`
    link.target = '_blank'
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden text-left flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0284C7] flex items-center justify-center shadow-xs">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Share & Export Observation
              </h3>
              <p className="text-xs text-slate-500">
                {observation.site_name} • ID #{observation.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-6 pt-3 gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('share')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'share'
                ? 'border-[#0284C7] text-[#0284C7]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 size={15} />
            <span>Social & Link</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-[#0284C7] text-[#0284C7]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode size={15} />
            <span>QR Code</span>
          </button>
          <button
            onClick={() => setActiveTab('fhir')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fhir'
                ? 'border-[#0284C7] text-[#0284C7]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode size={15} />
            <span>HL7 FHIR JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: SOCIAL & LINK */}
          {activeTab === 'share' && (
            <div className="space-y-6">
              {/* Copy Direct URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Direct Observation Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Social Channels Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Share to Networks & Messaging
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* WhatsApp */}
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-800 hover:text-emerald-700 transition-all cursor-pointer text-left text-xs font-semibold group shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <MessageCircle size={16} />
                    </div>
                    <span>WhatsApp</span>
                  </button>

                  {/* LinkedIn */}
                  <button
                    type="button"
                    onClick={handleShareLinkedIn}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-slate-800 hover:text-sky-700 transition-all cursor-pointer text-left text-xs font-semibold group shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#0077B5] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <LinkedinIcon />
                    </div>
                    <span>LinkedIn</span>
                  </button>

                  {/* Reddit */}
                  <button
                    type="button"
                    onClick={handleShareReddit}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 text-slate-800 hover:text-orange-700 transition-all cursor-pointer text-left text-xs font-semibold group shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF4500] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Send size={16} />
                    </div>
                    <span>Reddit</span>
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    onClick={handleShareFacebook}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-800 hover:text-blue-700 transition-all cursor-pointer text-left text-xs font-semibold group shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1877F2] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FacebookIcon />
                    </div>
                    <span>Facebook</span>
                  </button>

                  {/* Instagram */}
                  <button
                    type="button"
                    onClick={handleShareInstagram}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 text-slate-800 hover:text-pink-700 transition-all cursor-pointer text-left text-xs font-semibold group shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-200 via-pink-300 to-purple-300 text-purple-800 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Camera size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate">Instagram</span>
                      <span className="text-[10px] text-slate-400 block font-normal">Copy & Open</span>
                    </div>
                  </button>

                  {/* X / Twitter */}
                  <button
                    type="button"
                    onClick={handleShareTwitter}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-800 transition-all cursor-pointer text-left text-xs font-semibold group shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <TwitterIcon />
                    </div>
                    <span>X (Twitter)</span>
                  </button>
                </div>

                {copiedInstagram && (
                  <p className="mt-2 text-xs text-pink-600 bg-pink-50 p-2.5 rounded-xl border border-pink-200 flex items-center gap-1.5 animate-in fade-in">
                    <Check size={14} className="shrink-0" />
                    <span>Link & hashtags copied to clipboard! Paste into your Instagram Story, Reel, or bio link.</span>
                  </p>
                )}
              </div>

              {/* Native device share if supported */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Smartphone size={15} />
                  <span>Share via Device Apps (AirDrop, Messages, etc.)</span>
                </button>
              )}

              {/* Quick Observation Summary Snippet */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <img
                  src={observation.image_url}
                  alt={observation.site_name}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold text-slate-900 truncate">{observation.site_name}</p>
                  <p className="text-slate-500 text-[11px] truncate">{observation.location_address}</p>
                  <span className="inline-block mt-1 font-semibold text-[10px] px-2 py-0.5 rounded-md bg-sky-100 text-[#0284C7]">
                    Signal: {observation.signal.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REAL QR CODE */}
          {activeTab === 'qr' && (
            <div className="space-y-5 text-center flex flex-col items-center">
              <div className="p-4 bg-white rounded-3xl border-2 border-slate-200 shadow-lg inline-block">
                <img
                  src={qrCodeApiUrl}
                  alt={`QR code for ${observation.site_name}`}
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
                />
              </div>

              <div className="max-w-sm space-y-1">
                <p className="font-bold text-sm text-slate-800">
                  Direct Field QR Code
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Scan with any smartphone camera or QR reader to open this verified river observation immediately.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} />
                  <span>Download QR Image</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: HL7 FHIR JSON */}
          {activeTab === 'fhir' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Standardized HL7 FHIR R4 Environmental Observation payload (LOINC 82810-3).
                </p>
                <button
                  onClick={handleCopyFhir}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:underline cursor-pointer"
                >
                  {copiedFhir ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedFhir ? 'Copied JSON' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-teal-300 font-mono text-xs rounded-2xl overflow-x-auto max-h-72 border border-slate-800">
                {fhirData}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px] truncate max-w-[280px]">
            {shareUrl}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default FhirExportModal
