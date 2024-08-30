import { useCallback, useRef } from 'react'
import { useAnimationLoop, useLatest } from './hooks'
import { moveTowards } from './math'

export const TRANSPARENT_PIXEL_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

export function useSmoothAudio(props: { playing?: boolean, looping?: boolean, volume?: number, fadeRate?: number, speed?: number, pauseOnMute?: boolean }) {
    const audioRef = useRef<HTMLAudioElement>()
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
