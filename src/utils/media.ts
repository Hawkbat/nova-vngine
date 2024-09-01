import { useCallback, useRef } from 'react'
import { useAnimationLoop, useLatest } from './hooks'
import { moveTowards } from './math'
import { getPathExtension } from './path'

export const TRANSPARENT_PIXEL_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

export const IMAGE_MIME_TYPES = {
    apng: 'image/apng',
    png: 'image/png',
    avif: 'image/avif',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    jpe: 'image/jpeg',
    jif: 'image/jpeg',
    jfif: 'image/jpeg',
    webp: 'image/webp',
    svg: 'image/svg+xml',
}

export const IMAGE_EXTENSIONS = Object.keys(IMAGE_MIME_TYPES) as (keyof typeof IMAGE_MIME_TYPES)[]

export const AUDIO_MIME_TYPES = {
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    aac: 'audio/mp4',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
    flac: 'audio/flac',
}

export const AUDIO_EXTENSIONS = Object.keys(AUDIO_MIME_TYPES) as (keyof typeof AUDIO_MIME_TYPES)[]

export function getMimeType(path: string) {
    let ext = getPathExtension(path)
    if (ext.startsWith('.')) ext = ext.substring(1)
    if (ext in IMAGE_MIME_TYPES) return IMAGE_MIME_TYPES[ext as keyof typeof IMAGE_MIME_TYPES]
    if (ext in AUDIO_MIME_TYPES) return AUDIO_MIME_TYPES[ext as keyof typeof AUDIO_MIME_TYPES]
    return null
}

export function useSmoothAudio(props: { playing?: boolean, looping?: boolean, volume?: number, fadeRate?: number, speed?: number, pauseOnMute?: boolean }) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const latestProps = useLatest(props)
    useAnimationLoop(true, useCallback(dt => {
        const audio = audioRef.current
        if (!audio) return
        const { playing = true, looping = false, volume = 1, fadeRate = 1, speed = 1, pauseOnMute = true } = latestProps()
        const targetVolume = playing ? volume : 0
        audio.loop = looping
        audio.playbackRate = speed
        audio.preservesPitch = false
        audio.volume = moveTowards(audio.volume, targetVolume, fadeRate * dt)
        if (audio.paused && playing && (looping || !audio.ended) && (!pauseOnMute || audio.volume > 0)) {
            void audio.play()
        }
        if (!audio.paused && (!playing || (pauseOnMute && audio.volume === 0))) {
            audio.pause()
        }
    }, [latestProps]))
    return audioRef
}
