'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export interface VoiceRecognitionState {
  isListening: boolean
  transcript: string
  error: string | null
  isSupported: boolean
}

export interface UseVoiceRecognitionReturn extends VoiceRecognitionState {
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

export function useVoiceRecognition(lang = 'fr-FR'): UseVoiceRecognitionReturn {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    transcript: '',
    error: null,
    isSupported: false,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // Détection côté client uniquement (évite les erreurs SSR)
  useEffect(() => {
    setState(s => ({
      ...s,
      isSupported: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    }))
    return () => { recognitionRef.current?.abort() }
  }, [])

  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState(s => ({ ...s, error: 'Web Speech API non supportée par ce navigateur' }))
      return
    }

    const w = window as AnyRecord
    const SpeechRecognitionImpl: new () => AnyRecord =
      w['SpeechRecognition'] ?? w['webkitSpeechRecognition']
    const recognition = new SpeechRecognitionImpl()
    recognition['lang'] = lang
    recognition['interimResults'] = true
    recognition['continuous'] = false
    recognition['maxAlternatives'] = 1

    recognition['onstart'] = () => {
      setState(s => ({ ...s, isListening: true, error: null }))
    }

    recognition['onresult'] = (event: AnyRecord) => {
      const transcript = Array.from(event['results'] as ArrayLike<AnyRecord>)
        .map((r: AnyRecord) => String(r[0]['transcript']))
        .join('')
      setState(s => ({ ...s, transcript }))
    }

    recognition['onerror'] = (event: AnyRecord) => {
      setState(s => ({
        ...s,
        isListening: false,
        error: `Erreur reconnaissance vocale : ${event['error']}`,
      }))
    }

    recognition['onend'] = () => {
      setState(s => ({ ...s, isListening: false }))
    }

    recognitionRef.current = recognition
    recognition['start']()
  }, [state.isSupported, lang])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setState(s => ({ ...s, isListening: false }))
  }, [])

  const resetTranscript = useCallback(() => {
    setState(s => ({ ...s, transcript: '', error: null }))
  }, [])

  return { ...state, startListening, stopListening, resetTranscript }
}
