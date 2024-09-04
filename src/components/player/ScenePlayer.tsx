import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import { useAsset } from '../../store/assets'
import { projectStore } from '../../store/project'
import type { LocationHeightValue, LocationPositionValue, LocationScaleValue } from '../../types/expressions'
import type { BackdropPlayerState, CharacterPlayerState, DialoguePlayerState, OptionPlayerState, PromptPlayerState, ScenePlayerState, SongPlayerState, SoundPlayerState } from '../../types/player'
import { classes } from '../../utils/display'
import { throwIfNull } from '../../utils/guard'
import { useAnimationLoop, useLatest } from '../../utils/hooks'
import { useSmoothAudio } from '../../utils/media'
import { useSelector } from '../../utils/store'
import { COMMON_ICONS } from '../common/Icons'
import { TransitionGroup, useTransitionAnimationRef } from '../common/TransitionGroup'
import { PlayerIcon } from './PlayerIcon'

import styles from './ScenePlayer.module.css'

const POSITION_VALUES = {
    auto: 0.5,
    left: 0.125,
    center: 0.5,
    right: 0.875,
} satisfies Record<Extract<LocationPositionValue, string>, number>

const HEIGHT_VALUES = {
    auto: 0.6,
    full: 1.0,
    knees: 0.7,
    thighs: 0.6,
    waist: 0.4,
    shoulder: 0.3,
    head: 0.25,
} satisfies Record<Extract<LocationHeightValue, string>, number>

const SCALE_VALUES = {
    auto: 1.0,
    near: 1.5,
    middle: 1.0,
    far: 0.5,
} satisfies Record<Extract<LocationScaleValue, string>, number>

const Character = ({ characterID, portraitID, location }: CharacterPlayerState) => {
    const getCharacter = useSelector(projectStore, s => s.characters.find(c => c.id === characterID) ?? null)
    const getPortrait = useSelector(projectStore, s => {
        let portrait = s.portraits.find(p => p.id === portraitID)
        if (portrait && portrait.characterID !== getCharacter()?.id) {
            portrait = s.portraits.find(p => p.characterID === getCharacter()?.id && p.name === portrait?.name)
        }
        return portrait ?? null
    })
    const getImgUrl = useAsset(getPortrait()?.image ?? null, false)

    const position = typeof location.position === 'string' ? POSITION_VALUES[location.position] : location.position
    const height = typeof location.height === 'string' ? HEIGHT_VALUES[location.height] : location.height
    const scale = typeof location.scale === 'string' ? SCALE_VALUES[location.scale] : location.scale

    const portraitHeightValue = getPortrait()?.height ?? 'auto'
    const portraitHeight = typeof portraitHeightValue === 'string' ? HEIGHT_VALUES[portraitHeightValue] : portraitHeightValue

    const h = (1 / portraitHeight) * height
    const x = position
    const y = (1 - height) * 0.2
    const s = scale * (1 / h)

    return <div className={styles.characterPivot} style={{ left: `${String(x * 100)}%` }}>
        {getImgUrl() ? <img src={getImgUrl() ?? undefined} className={styles.character} style={{ top: `${String(y * 100)}%`, height: `${String(s * 100)}%` }} /> : null}
    </div>
}

const Backdrop = ({ backdropID }: BackdropPlayerState) => {
    const getBackdrop = useSelector(projectStore, s => s.backdrops.find(b => b.id === backdropID) ?? null)
    const getImgUrl = useAsset(getBackdrop()?.image ?? null, false)
    const imgUrl = getImgUrl()

    const ref = useTransitionAnimationRef(!!imgUrl, {
        in: [{ flexGrow: 0 }, { flexGrow: 1 }],
        inT: {},
        out: [{ flexGrow: 1 }, { flexGrow: 0 }],
        outT: {},
    })
    return <div ref={ref} className={styles.backdropPivot}>{imgUrl ? <div className={styles.backdropContainer}><img src={imgUrl} className={styles.backdrop} /></div> : null}</div>
}

const Backdrops = ({ backdrops }: { backdrops: BackdropPlayerState[] }) => {
    return <div className={styles.backdrops}>
        <TransitionGroup values={backdrops} getKey={b => b.backdropID}>
            {props => <Backdrop key={props.backdropID} backdropID={props.backdropID} />}
        </TransitionGroup>
    </div>
}

const Song = ({ songID, volume }: SongPlayerState & { volume: number }) => {
    const getSong = useSelector(projectStore, s => s.songs.find(s => s.id === songID) ?? null)
    const getAudioUrl = useAsset(getSong()?.audio ?? null, false)
    const audioRef = useSmoothAudio({ playing: true, looping: true, volume })
    return getAudioUrl() ? <audio src={getAudioUrl() ?? undefined} ref={audioRef} /> : null
}

const Sound = ({ soundID, volume }: SoundPlayerState & { volume: number }) => {
    const getSound = useSelector(projectStore, s => s.sounds.find(s => s.id === soundID) ?? null)
    const getAudioUrl = useAsset(getSound()?.audio ?? null, false)
    const audioRef = useSmoothAudio({ playing: true, volume })
    return getAudioUrl() ? <audio src={getAudioUrl() ?? undefined} ref={audioRef} /> : null
}

const Letter = ({ children }: { children: string }) => {
    const [animDone, setAnimDone] = useState(false)
    const ref = useRef<HTMLSpanElement>(null)
    useLayoutEffect(() => {
        throwIfNull(ref.current).animate([{ offset: 0, transform: 'scale(0)', opacity: 0 }, { offset: 0.8, transform: 'scale(1.2)', opacity: 1 }, { offset: 1.0, transform: 'scale(1)', opacity: 1 }], { duration: 1000 / 30 * 4 }).addEventListener('finish', () => setAnimDone(true))
    }, [])
    return animDone ? <>{children}</> : <i className={classes('l')} ref={ref}>{children}</i>
}

const textToContent = (text: string, start: number = 0, end: number = text.length) => {
    const content: React.ReactNode[] = []
    let i = 0
    const commitText = () => content.push(<span key={start}>{[...text.substring(start, i)].map((c, j) => <Letter key={`${String(start)}_${String(j)}`}>{c}</Letter>)}</span>)
    while (i < Math.min(text.length, end)) {
        if (text[i] === '\\') {
            if (i > start) commitText()
            i++
            if (i < text.length) {
                const code = text[i]
                if (code === 'n') {
                    content.push(<br key={i++} />)
                }
            }
            start = i
        } else {
            i++
        }
    }
    if (i > start) commitText()
    return <>{content}</>
}

const getTextLengthAtTime = (text: string, time: number) => {
    let i = Math.min(1, text.length)
    while (i < text.length && time > 0) {
        const c = text[i]
        if ((c === '.' || c === '!' || c === '?') && text[i + 1] === ' ') time -= 8
        else if (c === '-' && text[i - 1] === '-') time -= 8
        else if (c === ',' || c === ':') time -= 6
        else if (c === '\\') {
            i++
            if (text[i] === 'n') time -= 10
            else time--
        }
        else time--
        i++
    }
    return i
}

const DialogueText = ({ text, textSpeed }: { text: string, textSpeed: number }) => {
    const [textLength, setTextLength] = useState(1)
    const latestTextLength = useLatest(textLength)
    useAnimationLoop(true, useCallback((dt, et) => {
        const newLength = getTextLengthAtTime(text, et * textSpeed * 25)
        if (newLength <= text.length && newLength > latestTextLength()) {
            setTextLength(newLength)
        }
    }, [latestTextLength, textSpeed, text]))
    const divRef = useRef<HTMLDivElement>(null)
    useLayoutEffect(() => {
        if (divRef.current) {
            divRef.current.scrollIntoView({ block: 'end' })
        }
    }, [textLength])
    return <div ref={divRef} className={styles.dialogue}>{textToContent(text, 0, textLength)}&nbsp;{textLength >= text.length ? <PlayerIcon path={COMMON_ICONS.continue} anim='bob' /> : null}</div>
}

type DialogueBoxProps = DialoguePlayerState & { textSpeed: number }

const DialogueBox = ({ text, speakerAlias, speakerID, mode, textSpeed }: DialogueBoxProps) => {
    const getSpeaker = useSelector(projectStore, s => s.characters.find(c => c.id === speakerID) ?? null)
    const speakerName = speakerAlias ?? getSpeaker()?.name ?? null
    const animRef = useTransitionAnimationRef(true, {
        in: [{ opacity: 0, transform: 'translateY(-2em)' }, { opacity: 1, transform: 'translateY(0em)' }],
        inT: { duration: 200 },
        out: [{ opacity: 1, transform: 'translateY(0em)' }, { opacity: 0, transform: 'translateY(-2em)' }],
        outT: { duration: 200 },
    })

    return <div ref={animRef} className={styles.dialogueBox}>
        {text ? <DialogueText text={text} textSpeed={textSpeed} /> : null}
        {speakerName ? <div className={styles.speaker}>{textToContent(speakerName)}</div> : null}
    </div>
}

const DialoguePivot = (props: DialoguePlayerState & { textSpeed: number }) => {
    return <div className={classes(styles.dialoguePivot, { [styles.adv ?? '']: props.mode === 'adv', [styles.nvl ?? '']: props.mode === 'nvl' })}>
        <TransitionGroup values={props.text ? [props] : []} getKey={t => t.text ?? ''}>{(props, tran) => <DialogueBox {...props} />}</TransitionGroup>
    </div>
}

const Option = ({ enabled, text, index }: OptionPlayerState & { index: number }) => {
    return <div className={classes(styles.option, { [styles.enabled ?? '']: enabled })}>{index + 1}. {textToContent(text)}</div>
}

const StringPromptField = ({ initialValue }: { initialValue: string }) => {
    return <input defaultValue={initialValue} />
}

const Prompt = ({ label, type, initialValue }: PromptPlayerState) => {
    const subField = () => {
        switch (type) {
            case 'string': return <StringPromptField initialValue={String(initialValue)} />
            default: throw new Error(`Unimplemented prompt type ${type}`)
        }
    }
    return <div className={styles.prompt}>
        <div className={styles.promptLabel}>{textToContent(label)}</div>
        <div className={styles.promptField}>{subField()}</div>
    </div>
}

function getKey<T>(arr: T[], selector: (item: T) => string, item: T) {
    const search = selector(item)
    const index = arr.findIndex(o => o === item)
    const count = arr.slice(0, index).reduce((p, c) => selector(c) === search ? p + 1 : p, 0)
    const key = `${search}#${String(count)}`
    return key
}

export const ScenePlayer = ({ state, onClose }: { state: ScenePlayerState, onClose?: () => void }) => {

    const onSubmitPrompts = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    const onCloseClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onClose?.()
    }, [onClose])

    return <div className={styles.scene}>
        <div className={styles.viewbox}>
            <Backdrops backdrops={state.backdrops} />
            <div className={styles.characters}>
                {state.characters.map(c => <Character key={getKey(state.characters, c => c.characterID, c)} {...c} />)}
            </div>
        </div>
        <DialoguePivot {...state.dialogue} textSpeed={state.settings.textSpeed} />
        {state.options.length ? <div className={styles.options}>
            {state.options.map((o, i) => <Option key={i} {...o} index={i} />)}
        </div> : null}
        {state.prompts.length ? <div className={styles.prompts}>
            {state.prompts.map((p, i) => <Prompt key={`${String(i)}_${p.label}`} {...p} />)}
            <PlayerIcon size={3} path={COMMON_ICONS.success} label='Confirm' onClick={onSubmitPrompts} />
        </div> : null}
        <Song {...state.song} volume={state.settings.musicVolume} />
        {state.sounds.map(s => <Sound key={s.soundID} {...s} volume={state.settings.soundVolume} />)}
        {onClose ? <PlayerIcon className={styles.closer} path={COMMON_ICONS.close} onClick={onCloseClick} /> : null}
    </div>
}
