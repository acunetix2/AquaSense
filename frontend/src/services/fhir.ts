import type { Observation } from '../types/observation'

export interface FhirObservationResource {
  resourceType: 'Observation'
  id: string
  status: 'preliminary' | 'final' | 'amended'
  category: Array<{
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }>
  code: {
    coding: Array<{
      system: string
      code: string
      display: string
    }>
    text: string
  }
  subject: {
    display: string
  }
  effectiveDateTime: string
  issued: string
  performer: Array<{
    display: string
  }>
  valueCodeableConcept?: {
    coding: Array<{
      system: string
      code: string
      display: string
    }>
    text: string
  }
  interpretation?: Array<{
    coding: Array<{
      system: string
      code: string
      display: string
    }>
  }>
  note: Array<{
    text: string
  }>
  component?: Array<{
    code: {
      text: string
    }
    valueString?: string
    valueBoolean?: boolean
    valueQuantity?: {
      value: number
      unit: string
    }
  }>
  extension?: Array<{
    url: string
    valueString?: string
    valueDecimal?: number
  }>
}

/**
 * Maps an AquaSense freshwater observation to HL7 FHIR R4 Observation resource format.
 * Demonstrates interoperability readiness for IEEE OneAquaHealth digital health tracking.
 */
export function mapToFhirObservation(obs: Observation): FhirObservationResource {
  const signalCode =
    obs.signal === 'normal' ? 'NORM' : obs.signal === 'watch' ? 'A' : 'AA'

  const signalDisplay =
    obs.signal === 'normal'
      ? 'Normal Baseline'
      : obs.signal === 'watch'
      ? 'Watch / Anomaly Alert'
      : 'Critical / Investigation Urged'

  return {
    resourceType: 'Observation',
    id: `aquasense-obs-${obs.id}`,
    status: obs.status === 'verified' ? 'final' : 'preliminary',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'exam',
            display: 'Exam / Field Environmental Survey',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '82810-3',
          display: 'Freshwater stream physical and ecological assessment',
        },
      ],
      text: `Freshwater Observation at ${obs.site_name}`,
    },
    subject: {
      display: `Waterbody: ${obs.site_name} (${obs.latitude.toFixed(4)}, ${obs.longitude.toFixed(4)})`,
    },
    effectiveDateTime: obs.created_at,
    issued: new Date().toISOString(),
    performer: [
      {
        display: 'AquaSense Citizen Observer',
      },
    ],
    valueCodeableConcept: {
      coding: [
        {
          system: 'https://aquasense.ngo/signals',
          code: obs.signal,
          display: signalDisplay,
        },
      ],
      text: obs.signal.toUpperCase(),
    },
    interpretation: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: signalCode,
            display: signalDisplay,
          },
        ],
      },
    ],
    note: [
      {
        text: `AI Summary: ${obs.ai_summary}`,
      },
      ...(obs.notes ? [{ text: `Citizen Observer Notes: ${obs.notes}` }] : []),
    ],
    component: [
      {
        code: { text: 'Water Clarity' },
        valueString: obs.water_appearance,
      },
      {
        code: { text: 'Noticeable Odour' },
        valueString: obs.odour,
      },
      {
        code: { text: 'Visible Anthropogenic Waste' },
        valueBoolean: obs.waste_visible,
      },
      {
        code: { text: 'Flow Rate Condition' },
        valueString: obs.flow_rate,
      },
      {
        code: { text: 'AI Assessment Confidence' },
        valueQuantity: {
          value: Math.round(obs.confidence * 100),
          unit: '%',
        },
      },
    ],
    extension: [
      {
        url: 'https://aquasense.ngo/fhir/StructureDefinition/gps-coordinates',
        valueString: `${obs.latitude},${obs.longitude}`,
      },
      {
        url: 'https://aquasense.ngo/fhir/StructureDefinition/one-health-confidence',
        valueDecimal: obs.confidence,
      },
    ],
  }
}
