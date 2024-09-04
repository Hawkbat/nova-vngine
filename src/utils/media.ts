import { useCallback, useRef } from 'react'

import { loadImage } from './async'
import { throwIfNull } from './guard'
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
    const initialValuesSetRef = useRef(false)
    const latestProps = useLatest(props)
    useAnimationLoop(true, useCallback((dt, et) => {
        const audio = audioRef.current
        if (!audio) return
        const { playing = true, looping = false, volume = 1, fadeRate = 1, speed = 1, pauseOnMute = true } = latestProps()
        if (!initialValuesSetRef.current) {
            audio.loop = looping
            audio.playbackRate = speed
            audio.preservesPitch = false
            audio.volume = volume
            initialValuesSetRef.current = true
        }
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

export async function createThumbnail(src: string): Promise<Blob> {
    const img = await loadImage(src)
    const canvas = new OffscreenCanvas(100, 100)
    const ctx = throwIfNull(canvas.getContext('2d'))
    if (img.width > img.height) {
        const w = img.width * (canvas.height / img.height)
        const h = canvas.height
        const x = -(w - canvas.width) / 2
        const y = 0
        ctx.drawImage(img, x, y, w, h)
    } else {
        const w = canvas.width
        const h = img.height * (canvas.width / img.width)
        const x = 0
        //const y = -(h - canvas.height) / 2
        const y = 0 // Show top of portrait-style images, not center
        ctx.drawImage(img, x, y, w, h)
    }
    const blob = await canvas.convertToBlob({ type: 'image/png' })
    img.src = ''
    return blob
}
