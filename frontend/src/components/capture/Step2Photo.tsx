import React, { useRef, useState, useCallback } from 'react'
import {
  UploadCloud,
  Camera,
  X,
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Link2,
  ScanLine,
  AlertCircle,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
} from 'lucide-react'

import { getImageProxyUrl } from '../../services/api'
import { uploadObservationFiles } from '../../lib/supabase'

interface Step2PhotoProps {
  imageUrls: string[]
  imageDataList: string[]
  imageMime: string
  onChange: (urls: string[], dataList: string[], mime: string) => void
  onBack: () => void
  onNext: () => void
}

type CaptureMode = 'upload' | 'camera' | 'url'

const QUALITY_CHECKS = [
  'Image is clear and in focus',
  'Water body is visible',
  'Adequate lighting',
  'Multiple angles captured (up to 3 photos)',
]

export const Step2Photo: React.FC<Step2PhotoProps> = ({
  imageUrls,
  imageDataList,
  imageMime,
  onChange,
  onBack,
  onNext,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [activeMode, setActiveMode] = useState<CaptureMode>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Maximum allowed photos
  const MAX_IMAGES = 3

  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const availableSlots = MAX_IMAGES - imageUrls.length

    if (availableSlots <= 0) {
      setErrorMsg(`Maximum of ${MAX_IMAGES} photos reached. Remove one before adding another.`)
      return
    }

    const filesToProcess = fileArray.slice(0, availableSlots)
    setErrorMsg(null)

    const newUrls: string[] = [...imageUrls]
    const newDataList: string[] = [...imageDataList]
    let lastMime = imageMime || 'image/jpeg'

    const uploadAndFinalize = async () => {
      try {
        const uploadedUrls = await uploadObservationFiles(filesToProcess)

        const fileEntries = await Promise.all(
          filesToProcess.map(async (file) => {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = (event) => {
                const result = event.target?.result as string
                if (result) resolve(result)
                else reject(new Error('Unable to read uploaded image.'))
              }
              reader.onerror = () => reject(new Error('Unable to read uploaded image.'))
              reader.readAsDataURL(file)
            })

            const parts = dataUrl.split(',')
            const base64Data = parts.length > 1 ? parts[1] : dataUrl
            return {
              dataUrl,
              base64Data,
              mime: file.type || 'image/jpeg',
            }
          })
        )

        fileEntries.forEach(({ dataUrl, base64Data, mime }, idx) => {
          const storageUrl = uploadedUrls[idx] || dataUrl
          newUrls.push(storageUrl)
          newDataList.push(base64Data)
          lastMime = mime
        })

        onChange(newUrls, newDataList, lastMime)
        setSelectedIndex(newUrls.length - 1)
        setZoom(1)
        setRotation(0)
        setFlipped(false)
      } catch (err: any) {
        setErrorMsg(err?.message || 'Image upload failed. Please verify Supabase storage is configured.')
      }
    }

    void uploadAndFinalize()
  }, [imageUrls, imageDataList, imageMime, onChange])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return
    if (imageUrls.length >= MAX_IMAGES) {
      setErrorMsg(`Maximum of ${MAX_IMAGES} photos reached.`)
      return
    }

    setUrlLoading(true)
    setErrorMsg(null)
    try {
      // Use backend CORS proxy to safely fetch external web images without CORS rejection
      const proxyUrl = getImageProxyUrl(urlInput.trim())
      const response = await fetch(proxyUrl)
      if (!response.ok) throw new Error('Could not fetch image. Please verify the URL or try uploading a file.')
      
      const blob = await response.blob()
      if (!blob.type.startsWith('image/')) throw new Error('URL did not return a supported image format.')
      
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (result) {
          const parts = result.split(',')
          const base64Data = parts.length > 1 ? parts[1] : result
          const updatedUrls = [...imageUrls, result]
          const updatedData = [...imageDataList, base64Data]
          onChange(updatedUrls, updatedData, blob.type || 'image/jpeg')
          setSelectedIndex(updatedUrls.length - 1)
          setUrlInput('')
        }
      }
      reader.readAsDataURL(blob)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load image from URL. Please try uploading directly.')
    } finally {
      setUrlLoading(false)
    }
  }

  const removeImage = (indexToRemove: number) => {
    const updatedUrls = imageUrls.filter((_, idx) => idx !== indexToRemove)
    const updatedData = imageDataList.filter((_, idx) => idx !== indexToRemove)
    onChange(updatedUrls, updatedData, imageMime)
    if (selectedIndex >= updatedUrls.length) {
      setSelectedIndex(Math.max(0, updatedUrls.length - 1))
    }
  }

  const clearAllImages = () => {
    onChange([], [], 'image/jpeg')
    setSelectedIndex(0)
    setZoom(1)
    setRotation(0)
    setFlipped(false)
  }

  const hasImages = imageUrls.length > 0
  const activeImageUrl = imageUrls[selectedIndex] || imageUrls[0] || ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Capture water body photograph
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload, photograph, or link an image for AI analysis.
        </p>
      </div>

      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Mode Tabs and Photo Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {([
            { id: 'upload', icon: UploadCloud, label: 'Upload' },
            { id: 'camera', icon: Camera, label: 'Camera' },
            { id: 'url', icon: Link2, label: 'From URL' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveMode(id)
                if (id === 'camera') cameraInputRef.current?.click()
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeMode === id
                  ? 'bg-white text-[#0F4C81] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
          <span>Photos:</span>
          <span className={`px-2 py-0.5 rounded-lg ${imageUrls.length > 0 ? 'bg-[#0F4C81] text-white' : 'bg-slate-200 text-slate-600'}`}>
            {imageUrls.length} / {MAX_IMAGES}
          </span>
          {imageUrls.length > 0 && (
            <button
              type="button"
              onClick={clearAllImages}
              className="text-xs text-rose-600 hover:underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Input panel */}
        <div className="space-y-4">
          {/* Upload Zone */}
          {activeMode === 'upload' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (imageUrls.length < MAX_IMAGES) fileInputRef.current?.click()
              }}
              className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-200 min-h-[180px] group ${
                imageUrls.length >= MAX_IMAGES
                  ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                  : isDragging
                  ? 'border-[#0F4C81] bg-sky-50/60 scale-[1.01] cursor-pointer'
                  : 'border-slate-300 hover:border-[#0F4C81] hover:bg-sky-50/30 bg-white/70 cursor-pointer'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${
                isDragging ? 'bg-[#0F4C81] text-white' : 'bg-sky-50 text-[#0F4C81] group-hover:bg-[#0F4C81] group-hover:text-white'
              }`}>
                <UploadCloud size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {imageUrls.length >= MAX_IMAGES
                  ? 'Maximum 3 photos reached'
                  : isDragging
                  ? 'Drop to upload'
                  : 'Drag & drop photo here or click to browse'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {imageUrls.length < MAX_IMAGES
                  ? `You can upload up to ${MAX_IMAGES - imageUrls.length} more photo${MAX_IMAGES - imageUrls.length > 1 ? 's' : ''}`
                  : 'Remove an image below to add a new one'}
              </p>
              <div className="mt-3 flex gap-1.5 flex-wrap justify-center">
                {['JPG', 'PNG', 'WebP', 'HEIC'].map(fmt => (
                  <span key={fmt} className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold">
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* URL Mode */}
          {activeMode === 'url' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Image URL (Web image fetcher)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                    placeholder="https://images.unsplash.com/photo-..."
                    disabled={imageUrls.length >= MAX_IMAGES}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleUrlSubmit}
                    disabled={urlLoading || !urlInput.trim() || imageUrls.length >= MAX_IMAGES}
                    className="px-4 py-2.5 rounded-xl bg-[#0F4C81] text-white text-sm font-semibold hover:bg-[#0c3c66] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {urlLoading ? 'Fetching...' : 'Load'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Images are fetched through the secure AquaSense CORS proxy.
                </p>
              </div>

              {/* Sample Web Images for 1-click test */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Recent sample water bodies:</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Clear Lake', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
                    { label: 'River Basin', url: 'https://images.unsplash.com/photo-1498855926480-d98e83099315?auto=format&fit=crop&w=600&q=80' },
                    { label: 'Turbid Creek', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80' },
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={imageUrls.length >= MAX_IMAGES}
                      onClick={async () => {
                        setUrlInput(sample.url)
                        const proxyUrl = getImageProxyUrl(sample.url)
                        try {
                          setUrlLoading(true)
                          const res = await fetch(proxyUrl)
                          const blob = await res.blob()
                          const reader = new FileReader()
                          reader.onload = (ev) => {
                            const resData = ev.target?.result as string
                            if (resData) {
                              const parts = resData.split(',')
                              const b64 = parts.length > 1 ? parts[1] : resData
                              onChange([...imageUrls, resData], [...imageDataList, b64], blob.type || 'image/jpeg')
                              setSelectedIndex(imageUrls.length)
                            }
                          }
                          reader.readAsDataURL(blob)
                        } catch (e: any) {
                          setErrorMsg('Failed to load sample image: ' + e.message)
                        } finally {
                          setUrlLoading(false)
                        }
                      }}
                      className="group flex flex-col items-center gap-1 p-1.5 rounded-xl border border-slate-200 hover:border-[#0F4C81] hover:bg-sky-50/50 transition-all text-left cursor-pointer disabled:opacity-50"
                    >
                      <img src={sample.url} alt={sample.label} className="w-full h-12 rounded-lg object-cover" />
                      <span className="text-[10px] font-medium text-slate-700 truncate w-full text-center">{sample.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Camera mode message */}
          {activeMode === 'camera' && (
            <div className="rounded-2xl border border-slate-200 bg-sky-50/30 p-6 text-center">
              <Camera size={32} className="mx-auto text-[#0F4C81] mb-3" />
              <p className="text-sm font-semibold text-slate-800 mb-1">Camera capture ready</p>
              <p className="text-xs text-slate-500 mb-4">
                {imageUrls.length < MAX_IMAGES
                  ? `Capture up to ${MAX_IMAGES - imageUrls.length} more angle${MAX_IMAGES - imageUrls.length > 1 ? 's' : ''}`
                  : 'Maximum 3 photos reached.'}
              </p>
              <button
                type="button"
                disabled={imageUrls.length >= MAX_IMAGES}
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F4C81] text-white text-sm font-bold hover:bg-[#0c3c66] transition-colors cursor-pointer disabled:opacity-50"
              >
                <Camera size={16} />
                Open Camera
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Thumbnail Gallery Strip for Multi-Image (up to 3) */}
          {imageUrls.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Uploaded Photos ({imageUrls.length}/{MAX_IMAGES})</span>
                {imageUrls.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#0F4C81] font-semibold hover:underline cursor-pointer"
                  >
                    + Add photo
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedIndex === idx ? 'border-[#0F4C81] ring-2 ring-sky-200' : 'border-slate-200 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-16 object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(idx)
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 hover:bg-rose-600 text-white transition-colors"
                      title="Remove photo"
                    >
                      <X size={10} />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-semibold text-white">
                      #{idx + 1}
                    </div>
                  </div>
                ))}
                {imageUrls.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0F4C81] hover:bg-sky-50/40 text-slate-400 hover:text-[#0F4C81] h-16 transition-all cursor-pointer"
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                    <span className="text-[10px] font-semibold mt-0.5">Add</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Photo quality checklist */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
              <ScanLine size={13} />
              Photo quality checklist
            </p>
            <ul className="space-y-1.5">
              {QUALITY_CHECKS.map((check, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    hasImages ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {hasImages ? '✓' : ''}
                  </div>
                  {check}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Preview panel */}
        <div className={`relative rounded-2xl border overflow-hidden bg-slate-50 shadow-sm transition-all ${
          hasImages ? 'border-slate-200' : 'border-dashed border-slate-300'
        } min-h-[300px] flex items-center justify-center`}>
          {hasImages ? (
            <div className="relative w-full h-full min-h-[300px] group">
              {/* Image with transform controls */}
              <div className="w-full h-full min-h-[300px] overflow-hidden flex items-center justify-center bg-slate-900/5">
                <img
                  src={activeImageUrl}
                  alt={`River observation preview ${selectedIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipped ? -1 : 1})`,
                    maxHeight: isExpanded ? '70vh' : '300px',
                  }}
                />
              </div>

              {/* Photo indicator badge */}
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                <span>Photo {selectedIndex + 1} of {imageUrls.length}</span>
              </div>

              {/* Image controls overlay */}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => removeImage(selectedIndex)}
                  className="p-1.5 rounded-lg bg-slate-900/70 hover:bg-rose-600 text-white shadow-md transition-colors cursor-pointer"
                  title="Remove this photo"
                >
                  <X size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(v => !v)}
                  className="p-1.5 rounded-lg bg-slate-900/70 hover:bg-[#0F4C81] text-white shadow-md transition-colors cursor-pointer"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <Maximize2 size={14} />
                </button>
              </div>

              {/* Zoom/Rotate/Flip controls */}
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
                  className="p-1.5 rounded-lg bg-slate-900/70 hover:bg-white/20 text-white shadow-md transition-colors cursor-pointer"
                  title="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
                  className="p-1.5 rounded-lg bg-slate-900/70 hover:bg-white/20 text-white shadow-md transition-colors cursor-pointer"
                  title="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="p-1.5 rounded-lg bg-slate-900/70 hover:bg-white/20 text-white shadow-md transition-colors cursor-pointer"
                  title="Rotate 90°"
                >
                  <RotateCw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setFlipped(f => !f)}
                  className="p-1.5 rounded-lg bg-slate-900/70 hover:bg-white/20 text-white shadow-md transition-colors cursor-pointer"
                  title="Flip horizontal"
                >
                  <FlipHorizontal size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <ImageIcon size={32} className="stroke-1 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No photos selected yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Upload up to 3 photos of the water body from different angles. AquaSense AI will synthesize all views into a holistic assessment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Preview Banner when images are ready */}
      {hasImages && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#0F4C81]/8 to-[#1FB8A6]/8 border border-[#0F4C81]/20">
          <div className="w-8 h-8 rounded-lg bg-[#0F4C81] flex items-center justify-center shrink-0">
            <ScanLine size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              {imageUrls.length > 1
                ? `Multi-Angle Vision Ready (${imageUrls.length} photos)`
                : 'Photo ready for AI analysis'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {imageUrls.length > 1
                ? 'All images will be analyzed simultaneously by the Groq vision model to provide comprehensive environmental validation.'
                : 'You can proceed or attach up to 2 additional angles for higher precision.'}
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
            {imageUrls.length > 1 ? `${imageUrls.length} Angles` : 'Single Angle'}
          </span>
        </div>
      )}

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
          disabled={!hasImages}
          className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer ${
            hasImages
              ? 'bg-[#0F4C81] hover:bg-[#0c3c66] shadow-sm'
              : 'bg-slate-300 cursor-not-allowed opacity-70'
          }`}
        >
          Continue
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

