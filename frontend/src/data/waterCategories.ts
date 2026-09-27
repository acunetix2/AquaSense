import type { Observation } from '../types/observation'

export interface WaterCategory {
  id: string
  label: string
  description: string
  image: string
  match: (text: string) => boolean
}

export const observationText = (obs: Observation): string =>
  `${obs.site_name} ${obs.notes || ''} ${obs.location_address || ''}`.toLowerCase()

export const WATER_CATEGORIES: WaterCategory[] = [
  {
    id: 'all',
    label: 'All Observations',
    description: 'Every public record',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    match: () => true,
  },
  {
    id: 'rivers',
    label: 'Rivers',
    description: 'Flowing rivers, streams & creeks',
    image: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?auto=format&fit=crop&w=600&q=80',
    match: (t) => !t.includes('canal') && !t.includes('lake') && (t.includes('river') || t.includes('stream')),
  },
  {
    id: 'lakes',
    label: 'Lakes',
    description: 'Standing lakes & reservoirs',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80',
    match: (t) => t.includes('lake') || t.includes('reservoir'),
  },
  {
    id: 'urban',
    label: 'Urban Waters',
    description: 'Canals, drains & urban waterways',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80',
    match: (t) => t.includes('canal') || t.includes('urban') || t.includes('drain') || t.includes('bronx') || t.includes('runoff'),
  },
  {
    id: 'rapids',
    label: 'Rapids',
    description: 'Fast-flowing mountain reaches',
    image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80',
    match: (t) => t.includes('rapids') || t.includes('mountain') || t.includes('creek'),
  },
  {
    id: 'wetlands',
    label: 'Wetlands',
    description: 'Sanctuaries & wetland habitats',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
    match: (t) => t.includes('sanctuary') || t.includes('wetland'),
  },
  {
    id: 'deltas',
    label: 'Deltas',
    description: 'River deltas & confluences',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
    match: (t) => t.includes('delta') || t.includes('confluence'),
  },
  {
    id: 'tributaries',
    label: 'Tributaries',
    description: 'Tributaries & feeder channels',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&q=80',
    match: (t) => t.includes('tributary') || t.includes('feeder'),
  },
]

export const getCategory = (id: string): WaterCategory =>
  WATER_CATEGORIES.find((c) => c.id === id) ?? WATER_CATEGORIES[0]

export const matchesCategory = (obs: Observation, categoryId: string): boolean =>
  getCategory(categoryId).match(observationText(obs))

export const filterByCategory = (observations: Observation[], categoryId: string): Observation[] =>
  categoryId === 'all' ? observations : observations.filter((obs) => matchesCategory(obs, categoryId))

export const countByCategory = (observations: Observation[], categoryId: string): number =>
  filterByCategory(observations, categoryId).length
