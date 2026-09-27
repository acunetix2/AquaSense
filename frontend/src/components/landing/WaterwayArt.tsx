import React, { useId } from 'react'
import type { GlobalWaterway } from '../../data/globalWaterways'

type Scene = 'dunes' | 'canyon' | 'jungle' | 'falls' | 'alpine' | 'city' | 'savanna' | 'hills' | 'volcanic'

interface ArtSpec {
  scene: Scene
  sky: [string, string]
  sun: string
  landBack: string
  landFront: string
  water: string
  waterLight: string
  fore: string
}

const WATERWAY_ART: Record<string, ArtSpec> = {
  'nile-river': { scene: 'dunes', sky: ['#BFE1F5', '#FBF0D9'], sun: '#FFD166', landBack: '#EED9AE', landFront: '#DDBB78', water: '#2A9DD6', waterLight: '#8FD3F4', fore: '#C79A5B' },
  'lake-victoria': { scene: 'hills', sky: ['#CDEFFE', '#EFFBFF'], sun: '#FFD35C', landBack: '#8FCB9B', landFront: '#5FAE7E', water: '#19A7A0', waterLight: '#7FE0D8', fore: '#2F7F6B' },
  'congo-river': { scene: 'jungle', sky: ['#CDEBDD', '#EAF7F0'], sun: '#FFE08A', landBack: '#3E8C68', landFront: '#2C6B50', water: '#1F7A6B', waterLight: '#6FD6C4', fore: '#1B4F43' },
  'zambezi-river': { scene: 'falls', sky: ['#FFE7C2', '#FFF6E6'], sun: '#FFB35C', landBack: '#C9A96A', landFront: '#6E8F52', water: '#3FA7D6', waterLight: '#CFEFFF', fore: '#436B45' },
  'lake-tanganyika': { scene: 'alpine', sky: ['#D3E8F7', '#F0F7FC'], sun: '#FFEEA8', landBack: '#7C93A6', landFront: '#4E6B7A', water: '#0E6FA8', waterLight: '#8FD3F4', fore: '#26506B' },
  'mara-river': { scene: 'savanna', sky: ['#FFE2B8', '#FFF3DC'], sun: '#FF9F45', landBack: '#E8C98F', landFront: '#CFA35E', water: '#3FA7D6', waterLight: '#A8DDF4', fore: '#7A8F4B' },
  'nairobi-river': { scene: 'city', sky: ['#D6E8F4', '#F1F8FC'], sun: '#FFD35C', landBack: '#9FB6C4', landFront: '#6E8B99', water: '#3D8FB5', waterLight: '#A8DDF4', fore: '#4C6A78' },
  'athi-river': { scene: 'hills', sky: ['#FDE8C8', '#FFF6E8'], sun: '#FF9F45', landBack: '#D9B98A', landFront: '#B9915E', water: '#2E93C6', waterLight: '#A8DDF4', fore: '#8A6B44' },
  'danube-river': { scene: 'city', sky: ['#FFD9C0', '#FFE9D6'], sun: '#FF8C6B', landBack: '#7C8CA6', landFront: '#4A5A73', water: '#2E86C1', waterLight: '#9BD4F5', fore: '#334155' },
  'rhine-river': { scene: 'city', sky: ['#CFE6F5', '#EAF4FB'], sun: '#FFD166', landBack: '#8FA8B8', landFront: '#57748A', water: '#2A7FB8', waterLight: '#9BD4F5', fore: '#3B5568' },
  'lake-geneva': { scene: 'alpine', sky: ['#C9E4F6', '#EEF7FD'], sun: '#FFF3C4', landBack: '#8B9DB4', landFront: '#5B7089', water: '#1D7FB8', waterLight: '#B8E4FA', fore: '#3F5570' },
  'seine-river': { scene: 'city', sky: ['#FFC9A8', '#FFE4CE'], sun: '#FF8C5C', landBack: '#93A0B4', landFront: '#5A6880', water: '#2F86C7', waterLight: '#A8DDF4', fore: '#3E4A61' },
  'thames-river': { scene: 'city', sky: ['#B9C7E8', '#E4EAF7'], sun: '#FFF0B8', landBack: '#7E8CA8', landFront: '#4C5872', water: '#35648F', waterLight: '#9BB8E8', fore: '#333D55' },
  'lake-como': { scene: 'alpine', sky: ['#CBE6F2', '#F1F9FC'], sun: '#FFE9A8', landBack: '#8B9DB4', landFront: '#4F6B66', water: '#1780A8', waterLight: '#B8E4FA', fore: '#24564F' },
  'yangtze-river': { scene: 'hills', sky: ['#D6EEDD', '#F0FAF4'], sun: '#FFD35C', landBack: '#7FA98C', landFront: '#54826A', water: '#2E93B8', waterLight: '#9BD4F5', fore: '#37584B' },
  'ganges-river': { scene: 'hills', sky: ['#FFD9B3', '#FFF1DE'], sun: '#FF8C42', landBack: '#D9B98A', landFront: '#B08D5F', water: '#3A9BC9', waterLight: '#A8DDF4', fore: '#8A6B44' },
  'mekong-river': { scene: 'jungle', sky: ['#D8F0E0', '#F2FBF6'], sun: '#FFE08A', landBack: '#4E9B74', landFront: '#37785A', water: '#2E9E8F', waterLight: '#7FE0D4', fore: '#1F5B49' },
  'lake-baikal': { scene: 'alpine', sky: ['#DCEEFF', '#F7FBFF'], sun: '#FFF9D6', landBack: '#B9CFE0', landFront: '#8FB0C9', water: '#0F6FD1', waterLight: '#D6ECFF', fore: '#2A4A78' },
  'indus-river': { scene: 'dunes', sky: ['#FFE1B8', '#FFF5E2'], sun: '#FF9F45', landBack: '#E6C896', landFront: '#D1AC72', water: '#2FA0D8', waterLight: '#A8DDF4', fore: '#B08D5F' },
  'amazon-river': { scene: 'jungle', sky: ['#CDEEDC', '#EAF9EF'], sun: '#FFDE7A', landBack: '#2F855A', landFront: '#226B47', water: '#2E9484', waterLight: '#8FE8D6', fore: '#1A4F38' },
  'lake-superior': { scene: 'alpine', sky: ['#CFE7F7', '#F1F9FE'], sun: '#FFF3C4', landBack: '#8B9DB4', landFront: '#5E7284', water: '#1B76C2', waterLight: '#B8E4FA', fore: '#3F5568' },
  'mississippi-river': { scene: 'hills', sky: ['#D8EAF6', '#F2FAFD'], sun: '#FFD35C', landBack: '#8CA98A', landFront: '#5F8260', water: '#3D8FB5', waterLight: '#A8DDF4', fore: '#3F5E42' },
  'lake-titicaca': { scene: 'hills', sky: ['#C7E3F7', '#EFF8FE'], sun: '#FFD97A', landBack: '#A9A179', landFront: '#857C55', water: '#1E88C7', waterLight: '#B8E4FA', fore: '#6E6741' },
  'colorado-river': { scene: 'canyon', sky: ['#FFE0C2', '#FFF3E3'], sun: '#FF9F45', landBack: '#C96F4A', landFront: '#A85435', water: '#2E9BC9', waterLight: '#A8DDF4', fore: '#8C4A2F' },
  'parana-river': { scene: 'falls', sky: ['#D9F0E4', '#F1FBF7'], sun: '#FFD35C', landBack: '#7FA98C', landFront: '#4F7D62', water: '#2C94B4', waterLight: '#E6FFFA', fore: '#2F6B4E' },
  'murray-river': { scene: 'dunes', sky: ['#DCEEF8', '#F6FBFE'], sun: '#FFB35C', landBack: '#D8C08C', landFront: '#C0A46E', water: '#2E93C6', waterLight: '#A8DDF4', fore: '#9C7A44' },
  'waikato-river': { scene: 'hills', sky: ['#D6EDE6', '#F1FAF7'], sun: '#FFE08A', landBack: '#5F9179', landFront: '#3E7A66', water: '#1F97AE', waterLight: '#8FE0EA', fore: '#1F5B4C' },
  'lake-taupo': { scene: 'volcanic', sky: ['#D9E8F5', '#F4F9FD'], sun: '#FFD35C', landBack: '#6E8A84', landFront: '#4F6B64', water: '#0E86B8', waterLight: '#A8DDF4', fore: '#3A564F' },
}

const DEFAULT_RIVER: ArtSpec = {
  scene: 'hills',
  sky: ['#CFE9F7', '#F2FBFF'],
  sun: '#FFD35C',
  landBack: '#8CA98A',
  landFront: '#5F8260',
  water: '#2E93C6',
  waterLight: '#A8DDF4',
  fore: '#3F5E42',
}

const DEFAULT_LAKE: ArtSpec = {
  ...DEFAULT_RIVER,
  scene: 'alpine',
}

function renderBack(scene: Scene, s: ArtSpec): React.ReactNode {
  switch (scene) {
    case 'dunes':
      return (
        <>
          <path d="M0 78 Q70 60 150 74 T320 68 V144 H0Z" fill={s.landBack} />
          <path d="M0 102 Q90 84 180 98 T320 92 V144 H0Z" fill={s.landFront} />
        </>
      )
    case 'canyon':
      return (
        <>
          <path d="M0 62 H56 V44 H110 V68 H166 V50 H218 V72 H276 V56 H320 V144 H0Z" fill={s.landBack} />
          <path d="M0 86 H92 V70 H156 V92 H236 V76 H320 V144 H0Z" fill={s.landFront} />
        </>
      )
    case 'jungle':
      return (
        <>
          <path d="M0 88 Q24 64 50 84 Q76 58 104 80 Q132 56 160 78 Q190 54 220 78 Q250 58 278 80 Q304 62 320 76 V144 H0Z" fill={s.landBack} />
          <circle cx="44" cy="76" r="15" fill={s.landFront} />
          <circle cx="90" cy="82" r="11" fill={s.landFront} />
          <path d="M0 108 Q60 92 130 104 Q210 118 320 102 V144 H0Z" fill={s.landFront} />
        </>
      )
    case 'falls':
      return (
        <>
          <path d="M0 56 H126 V44 H196 V62 H320 V144 H0Z" fill={s.landBack} />
          <rect x="130" y="46" width="62" height="8" fill={s.water} />
          <path d="M0 106 Q70 98 128 110 Q186 122 250 112 Q292 106 320 110 V144 H0Z" fill={s.landFront} />
        </>
      )
    case 'alpine':
      return (
        <>
          <path d="M0 100 L46 44 L84 84 L128 34 L176 86 L222 48 L268 88 L320 56 V144 H0Z" fill={s.landBack} />
          <path d="M116 50 L128 34 L140 50 L133 46 L128 52 L121 46 Z" fill="#FFFFFF" opacity="0.85" />
          <path d="M36 58 L46 44 L56 58 L51 54 L46 60 L41 54 Z" fill="#FFFFFF" opacity="0.85" />
          <path d="M0 112 Q100 96 200 108 T320 106 V144 H0Z" fill={s.landFront} />
        </>
      )
    case 'city': {
      const buildings: Array<[number, number, number]> = [
        [2, 46, 26], [28, 64, 24], [54, 38, 28], [84, 74, 22],
        [110, 52, 30], [142, 68, 24], [170, 44, 26], [200, 76, 22],
        [226, 56, 28], [256, 66, 24], [284, 42, 30], [310, 60, 20],
      ]
      return (
        <>
          {buildings.map(([x, h, w], i) => (
            <g key={x}>
              <rect x={x} y={112 - h} width={w} height={h} rx="2" fill={i % 2 ? s.landFront : s.landBack} />
              {i % 2 === 0 && <rect x={x + 5} y={118 - h} width="4" height="5" fill="#FFF7D6" opacity="0.85" />}
            </g>
          ))}
          <path d="M0 116 Q90 108 180 114 T320 112 V144 H0Z" fill={s.landFront} />
        </>
      )
    }
    case 'savanna':
      return (
        <>
          <path d="M0 96 Q80 78 170 92 T320 88 V144 H0Z" fill={s.landBack} />
          <rect x="70" y="70" width="4" height="30" fill="#6B4F2A" />
          <ellipse cx="72" cy="66" rx="28" ry="9" fill="#6F8F4A" />
          <path d="M0 114 Q120 100 320 108 V144 H0Z" fill={s.landFront} />
        </>
      )
    case 'volcanic':
      return (
        <>
          <path d="M0 84 Q60 62 140 72 Q160 74 178 72 Q246 64 320 78 V144 H0Z" fill={s.landBack} />
          <path d="M0 104 Q90 88 190 100 T320 98 V144 H0Z" fill={s.landFront} />
        </>
      )
    case 'hills':
    default:
      return (
        <>
          <path d="M0 92 Q60 62 130 84 T260 78 Q300 72 320 80 V144 H0Z" fill={s.landBack} />
          <path d="M0 110 Q80 92 170 106 T320 102 V144 H0Z" fill={s.landFront} />
        </>
      )
  }
}

function renderWater(scene: Scene, s: ArtSpec, isLake: boolean): React.ReactNode {
  if (isLake) {
    return (
      <>
        <ellipse cx="160" cy="152" rx="250" ry="68" fill={s.water} />
        <path d="M52 124 Q130 116 216 122" stroke={s.waterLight} strokeWidth="3" fill="none" opacity="0.55" strokeLinecap="round" />
        <path d="M96 136 Q170 130 250 135" stroke={s.waterLight} strokeWidth="3" fill="none" opacity="0.4" strokeLinecap="round" />
      </>
    )
  }
  if (scene === 'city') {
    return (
      <>
        <path d="M-10 122 C60 112 120 126 190 116 C250 108 290 118 330 112" stroke={s.water} strokeWidth="30" fill="none" />
        <path d="M20 118 C80 112 130 122 190 114" stroke={s.waterLight} strokeWidth="4" fill="none" opacity="0.5" strokeLinecap="round" />
      </>
    )
  }
  if (scene === 'falls') {
    return (
      <>
        <ellipse cx="156" cy="146" rx="170" ry="42" fill={s.water} />
        <path d="M132 58 H194 L188 106 Q163 118 138 106 Z" fill={s.waterLight} opacity="0.92" />
        <path d="M146 62 L143 100" stroke="#FFFFFF" strokeWidth="3" opacity="0.55" strokeLinecap="round" />
        <path d="M164 62 L163 104" stroke="#FFFFFF" strokeWidth="3" opacity="0.5" strokeLinecap="round" />
        <path d="M180 62 L178 98" stroke="#FFFFFF" strokeWidth="3" opacity="0.55" strokeLinecap="round" />
        <ellipse cx="162" cy="112" rx="52" ry="13" fill="#FFFFFF" opacity="0.5" />
      </>
    )
  }
  return (
    <>
      <path d="M170 88 C158 104 132 114 104 124 C82 132 62 142 50 162" stroke={s.water} strokeWidth="20" fill="none" strokeLinecap="round" />
      <path d="M165 96 C154 109 134 117 112 126" stroke={s.waterLight} strokeWidth="6" fill="none" opacity="0.45" strokeLinecap="round" />
    </>
  )
}

function renderFore(s: ArtSpec): React.ReactNode {
  return (
    <>
      <ellipse cx="26" cy="142" rx="20" ry="9" fill={s.fore} opacity="0.85" />
      <path d="M300 148 Q304 130 310 122" stroke={s.fore} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M308 148 Q313 132 320 126" stroke={s.fore} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M292 148 Q295 136 300 130" stroke={s.fore} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  )
}

interface WaterwayArtProps {
  waterway: GlobalWaterway
  className?: string
}

export const WaterwayArt: React.FC<WaterwayArtProps> = ({ waterway, className = '' }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const spec = WATERWAY_ART[waterway.id] ?? (waterway.type === 'lake' ? DEFAULT_LAKE : DEFAULT_RIVER)
  const isLake = waterway.type === 'lake'

  return (
    <svg
      viewBox="0 0 320 144"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label={`Illustrated view of ${waterway.name}`}
    >
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={spec.sky[0]} />
          <stop offset="100%" stopColor={spec.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="320" height="144" fill={`url(#sky${uid})`} />
      <circle cx="262" cy="30" r="13" fill={spec.sun} opacity="0.9" />
      {renderBack(spec.scene, spec)}
      {renderWater(spec.scene, spec, isLake)}
      {renderFore(spec)}
    </svg>
  )
}

export default WaterwayArt
