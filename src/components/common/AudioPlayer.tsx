import { useRef, useState } from 'react'

import { useAnimationLoop } from '../../utils/hooks'
import { useSmoothAudio } from '../../utils/media'
import { EditorIcon } from './EditorIcon'
import { COMMON_ICONS, EXPR_ICONS } from './Icons'
import { Slider } from './Slider'

import styles from './AudioPlayer.module.css'

export const AudioPlayer = ({ src }: { src: string | null }) => {
    const [playing, setPlaying] = useState(false)
    const [looping, setLooping] = useState(false)
    const [volume, setVolume] = useState(1)
    const audioRef = useSmoothAudio({ playing, looping, volume })
    const sliderRef = useRef<HTMLInputElement>(null)
    const timeRef = useRef<HTMLDivElement>(null)
    useAnimationLoop(true, (dt, et) => {
        if (!audioRef.current) return
        const time = audioRef.current.currentTime
        const length = audioRef.current.duration
        if (sliderRef.current) {
            sliderRef.current.min = String(0)
            sliderRef.current.max = String(length)
            sliderRef.current.step = 'any'
            sliderRef.current.value = String(time)
        }
        if (timeRef.current) {
            const timeStr = isNaN(time) ? '?:??' : `${Math.floor(time / 60).toString()}:${Math.floor(time % 60).toString().padStart(2, '0')}`
            const lengthStr = isNaN(length) ? '?:??' : `${Math.floor(length / 60).toString()}:${Math.floor(length % 60).toString().padStart(2, '0')}`
            timeRef.current.textContent = `${timeStr} / ${lengthStr}`
        }
    })
    return <div className={styles.player}>
        <EditorIcon path={playing ? COMMON_ICONS.pause : COMMON_ICONS.play} active={playing} onClick={() => setPlaying(v => !v)} />
        <Slider inputRef={sliderRef} className={styles.slider} value={0} setValue={v => audioRef.current ? audioRef.current.currentTime = v : void 0} />
        <div ref={timeRef} className={styles.time}>0:00 / ?:??</div>
        <audio ref={audioRef} src={src ?? undefined} />
        <EditorIcon path={COMMON_ICONS.restart} active={looping} onClick={() => setLooping(v => !v)} />
        <EditorIcon path={EXPR_ICONS.sound} active={volume > 0} onClick={() => setVolume(v => v > 0 ? 0 : 1)} />
        <Slider className={styles.slider} value={volume} setValue={v => setVolume(v)} />
    </div>
}
