import { type CSSProperties, useCallback, useLayoutEffect, useRef, useState } from 'react'

import clickSrc from '../../sounds/click.mp3'
import { useAsset } from '../../store/assets'
import { projectStore } from '../../store/project'
import { settingsStore } from '../../store/settings'
import type { LocationHeightValue, LocationPositionValue, LocationScaleValue } from '../../types/expressions'
import type { BackdropPlayerState, CharacterPlayerState, DialoguePlayerState, OptionPlayerState, PromptPlayerState, ScenePlayerState, SongPlayerState, SoundPlayerState } from '../../types/player'
import { classes } from '../../utils/display'
import { throwIfNull } from '../../utils/guard'
import { createEventContext, useAnimationLoop, useDOMEventListener, useLatest, useLatestIfValid, useStateFromProps } from '../../utils/hooks'
import { useSmoothAudio } from '../../utils/media'
import { useSelector } from '../../utils/store'
import { COMMON_ICONS } from '../common/Icons'
import { TransitionGroup, useTransitionAnimationRef, useTransitionState } from '../common/TransitionGroup'
import { PlayerIcon } from './PlayerIcon'

import styles from './ScenePlayer.module.css'

const POSITION_VALUES = {
    auto: 0.5,
    left: 0.15,
    center: 0.5,
    right: 0.85,
} satisfies Record<Extract<LocationPositionValue, string>, number>

const HEIGHT_VALUES = {
    auto: 0.6,
    full: 1.0,
    knees: 0.8,
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

const playClick = () => {
    const audio = new Audio(clickSrc)
    audio.volume = settingsStore.getValue().scenePlayerSettings.uiVolume
    void audio.play()
}

const getDedupedKey = <T,>(arr: T[], selector: (item: T) => string, item: T) => {
    const search = selector(item)
    const index = arr.findIndex(o => o === item)
    const count = index <= 0 ? 0 : arr.slice(0, index).reduce((p, c) => selector(c) === search ? p + 1 : p, 0)
    const key = `${search}#${String(count)}`
    return key
}

const textToContent = (text: string, animate: boolean, start: number = 0, end: number = text.length) => {
    const content: React.ReactNode[] = []
    let italic = false
    let bold = false
    let styles: Partial<CSSProperties> | null = null
    let i = 0
    const commitText = () => content.push(<span key={start} className={classes({ b: bold, i: italic })} style={{ ...styles }}>{[...text.substring(start, i)].map((c, j) => animate ? <Letter key={`${String(start)}_${String(j)}`}>{c}</Letter> : c)}</span>)
    while (i < Math.min(text.length, end)) {
        if (text[i] === '/' && text[i + 1] === '/') {
            if (i > start) commitText()
            italic = !italic
            i += 2
            start = i
        } else if (text[i] === '\'' && text[i + 1] === '\'') {
            if (i > start) commitText()
            bold = !bold
            i += 2
            start = i
        } else if (text[i] === '@' && text[i + 1] === '@') {
            if (i > start) commitText()
            i += 2
            if (styles !== null) {
                styles = null
            } else {
                const endIndex = text.indexOf(';', i + 2)
                const styleStr = text.substring(i, endIndex)
                const [k, v] = styleStr.split(':')
                styles = { [k ?? '']: v }
                i = endIndex + 1
            }
            start = i
        } else if (text[i] === '\\') {
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

interface PortraitProps {
    src: string
    mimeType: string
    y: number
    s: number
}

const PortraitImage = ({ src, mimeType, y, s }: PortraitProps) => {
    const ref = useTransitionAnimationRef(true, {
        in: [{ opacity: 0 }, { opacity: 1 }],
        inT: {},
        out: [{ opacity: 1 }, { opacity: 0 }],
        outT: {},
    })

    return <picture><source srcSet={src} type={mimeType} /><img ref={ref} src={src} className={styles.character} style={{ top: `${String(y * 100)}%`, height: `${String(s * 100)}%` }} /></picture>
}

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
    const currentImgUrl = getImgUrl()
    const lastGoodImgUrl = useLatestIfValid(currentImgUrl)
    const imgUrl = lastGoodImgUrl()

    const ref = useTransitionAnimationRef(!!imgUrl, {
        in: [{ opacity: 0 }, { opacity: 1 }],
        inT: {},
        out: [{ opacity: 1 }, { opacity: 0 }],
        outT: {},
    })

    const position = typeof location.position === 'string' ? POSITION_VALUES[location.position] : location.position
    const height = typeof location.height === 'string' ? HEIGHT_VALUES[location.height] : location.height
    const scale = typeof location.scale === 'string' ? SCALE_VALUES[location.scale] : location.scale

    const portraitHeightValue = getPortrait()?.height ?? 'auto'
    const portraitHeight = typeof portraitHeightValue === 'string' ? HEIGHT_VALUES[portraitHeightValue] : portraitHeightValue

    const h = (1 / portraitHeight) * height
    const x = position
    const y = (1 - height) * 0.2
    const s = scale * (1 / h)

    return <div ref={ref} className={styles.characterPivot} style={{ left: `${String(x * 100)}%` }}>
        <TransitionGroup<PortraitProps> values={imgUrl ? [{ src: imgUrl, mimeType: getPortrait()?.image?.mimeType ?? 'image/png', s, y }] : []} getKey={v => v.src}>
            {props => <PortraitImage key={props.src} {...props} />}
        </TransitionGroup>
    </div>
}

const Characters = ({ characters }: { characters: CharacterPlayerState[] }) => {
    return <div className={styles.characters}>
        <TransitionGroup values={characters} getKey={c => getDedupedKey(characters, c => c.characterID, c)}>
            {props => <Character key={props.characterID} {...props} />}
        </TransitionGroup>
    </div>
}

const Backdrop = ({ backdropID, dir }: BackdropPlayerState) => {
    const getBackdrop = useSelector(projectStore, s => s.backdrops.find(b => b.id === backdropID) ?? null)
    const getImgUrl = useAsset(getBackdrop()?.image ?? null, false)
    const imgUrl = getImgUrl()

    const first = dir === 0

    const ref = useTransitionAnimationRef(!!imgUrl, {
        in: first ? [{ opacity: 0, flexGrow: 0 }, { opacity: 1, flexGrow: 1 }] : [{ flexGrow: 0 }, { flexGrow: 1 }],
        inT: { easing: 'ease-in-out', duration: 500 },
        out: first ? [{ opacity: 1, flexGrow: 1 }, { opacity: 0, flexGrow: 0 }] : [{ flexGrow: 1 }, { flexGrow: 0 }],
        outT: { easing: 'ease-in-out', duration: 500 },
    })
    return <div ref={ref} className={classes(styles.backdropPivot, { [styles.before ?? '']: dir === -1, [styles.after ?? '']: dir === 1 })}>{imgUrl ? <div className={styles.backdropContainer}>
        <picture><source srcSet={imgUrl} type={getBackdrop()?.image?.mimeType} /><img src={imgUrl} className={styles.backdrop} /></picture>
    </div> : null}</div>
}

const Backdrops = ({ backdrops }: { backdrops: BackdropPlayerState[] }) => {
    return <div className={styles.backdrops}>
        <TransitionGroup values={backdrops} getKey={b => `${b.backdropID}_${String(b.dir)}`} sort={(a, b) => a.dir - b.dir}>
            {props => <Backdrop key={props.backdropID} {...props} />}
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
    const transition = useTransitionState()
    if (transition.state === 'in') transition.end(transition.key)
    const getSound = useSelector(projectStore, s => s.sounds.find(s => s.id === soundID) ?? null)
    const getAudioUrl = useAsset(getSound()?.audio ?? null, false)
    const audioRef = useSmoothAudio({ playing: true, volume })
    const onEnded = useCallback(() => {
        transition.end(transition.key)
    }, [transition])
    return getAudioUrl() ? <audio src={getAudioUrl() ?? undefined} ref={audioRef} onEnded={onEnded} /> : null
}

const Sounds = ({ sounds, volume }: { sounds: SoundPlayerState[], volume: number }) => {
    return <TransitionGroup values={sounds} getKey={s => s.soundID}>
        {props => <Sound {...props} volume={volume} />}
    </TransitionGroup>
}

const Letter = ({ children }: { children: string }) => {
    const [animDone, setAnimDone] = useState(false)
    const ref = useRef<HTMLSpanElement>(null)
    useLayoutEffect(() => {
        throwIfNull(ref.current).animate([{ offset: 0, transform: 'scale(0)', opacity: 0 }, { offset: 0.8, transform: 'scale(1.2)', opacity: 1 }, { offset: 1.0, transform: 'scale(1)', opacity: 1 }], { duration: 1000 / 30 * 4 }).addEventListener('finish', () => setAnimDone(true))
    }, [])
    return animDone ? <>{children}</> : <i className={classes('l')} ref={ref}>{children}</i>
}

const DialogueText = ({ text, textSpeed, canAdvance }: { text: string, textSpeed: number, canAdvance: boolean }) => {
    const [textLength, setTextLength] = useState(1)
    const [skipped, setSkipped] = useState(false)
    const latestTextLength = useLatest(textLength)
    useAnimationLoop(textLength < text.length, useCallback((dt, et) => {
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

    advanceEvent.useListener(useCallback(() => {
        if (latestTextLength() < text.length) {
            setTextLength(text.length)
            setSkipped(true)
            return false
        }
        return true
    }, [latestTextLength, text.length]))

    return <div ref={divRef} className={styles.dialogue}>{textToContent(text, !skipped, 0, textLength)}&nbsp;{textLength >= text.length && canAdvance ? <PlayerIcon path={COMMON_ICONS.continue} anim='bob' /> : null}</div>
}

type DialogueBoxProps = DialoguePlayerState & { textSpeed: number, canAdvance: boolean }

const DialogueBox = ({ text, speakerAlias, speakerID, mode, textSpeed, canAdvance }: DialogueBoxProps) => {
    const getSpeaker = useSelector(projectStore, s => s.characters.find(c => c.id === speakerID) ?? null)
    const speakerName = speakerAlias ?? getSpeaker()?.name ?? null
    const animRef = useTransitionAnimationRef(true, {
        in: [{ opacity: 0, transform: 'translateY(-2em)' }, { opacity: 1, transform: 'translateY(0em)' }],
        inT: { duration: 200 },
        out: [{ opacity: 1, transform: 'translateY(0em)' }, { opacity: 0, transform: 'translateY(-2em)' }],
        outT: { duration: 200 },
    })

    return <div ref={animRef} className={classes(styles.dialogueBox, { [styles.adv ?? '']: mode === 'adv', [styles.nvl ?? '']: mode === 'nvl', [styles.pop ?? '']: mode === 'pop' })}>
        {text ? <DialogueText text={text} textSpeed={textSpeed} canAdvance={canAdvance} /> : null}
        {speakerName ? <div className={styles.speaker}>{textToContent(speakerName, false)}</div> : null}
    </div>
}

const Dialogue = (props: DialogueBoxProps) => {
    return <div className={classes(styles.dialoguePivot)}>
        <TransitionGroup values={props.text ? [props] : []} getKey={t => t.text ?? ''}>{(props, tran) => <DialogueBox {...props} />}</TransitionGroup>
    </div>
}

const Option = ({ enabled, text, index, onSelectOption }: OptionPlayerState & { onSelectOption: (index: number) => void }) => {
    const animRef = useTransitionAnimationRef(true, {
        in: [{ opacity: 0, transform: 'translateX(-2em)' }, { opacity: 1, transform: 'translateX(0em)' }],
        inT: { duration: 200 },
        out: [{ opacity: 1, transform: 'translateX(0em)' }, { opacity: 0, transform: 'translateX(-2em)' }],
        outT: { duration: 200 },
    })
    const onClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (!enabled) return
        onSelectOption(index)
        playClick()
    }, [enabled, index, onSelectOption])
    return <div ref={animRef} className={classes(styles.option, { [styles.enabled ?? '']: enabled })} onClick={onClick}>{index + 1}. {textToContent(text, false)}</div>
}

const Options = ({ options, onSelectOption }: { options: OptionPlayerState[], onSelectOption: (index: number) => void }) => {
    return <div className={styles.options}>
        <TransitionGroup values={options} getKey={o => `${String(o.index)}_${o.text}`} sort={(a, b) => a.index - b.index}>
            {props => <Option {...props} onSelectOption={onSelectOption} />}
        </TransitionGroup>
    </div>
}

const StringPromptField = ({ value, setValue }: { value: unknown, setValue: (value: unknown) => void }) => {
    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key !== 'Enter') e.stopPropagation()
        if (e.key === ' ') e.preventDefault()
    }, [])
    return <input autoFocus value={String(value)} onChange={e => setValue(e.target.value)} onKeyDown={onKeyDown} />
}

const Prompt = ({ label, type, initialValue, randomizable, onSubmitPrompt, onRandomizePrompt }: PromptPlayerState & { onSubmitPrompt: (value: unknown) => void, onRandomizePrompt: () => void }) => {
    const [value, setValue] = useStateFromProps(initialValue)

    const animRef = useTransitionAnimationRef(true, {
        in: [{ opacity: 0, transform: 'translateX(2em)' }, { opacity: 1, transform: 'translateX(0em)' }],
        inT: { duration: 200 },
        out: [{ opacity: 1, transform: 'translateX(0em)' }, { opacity: 0, transform: 'translateX(-2em)' }],
        outT: { duration: 200 },
    })

    const onSubmitPromptsClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onSubmitPrompt(value)
        playClick()
    }

    const subField = () => {
        switch (type) {
            case 'string': return <StringPromptField value={value} setValue={setValue} />
            default: throw new Error(`Unimplemented prompt type ${type}`)
        }
    }

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            playClick()
            onSubmitPrompt(value)
        }
    }

    return <div ref={animRef} className={styles.prompt} onClick={onClick} onKeyDown={onKeyDown}>
        <div className={styles.promptBox}>
            <div className={styles.promptLabel}>{textToContent(label, false)}</div>
            <div className={styles.promptField}>
                {subField()}
                {randomizable ? <PlayerIcon path={COMMON_ICONS.randomize} label='Randomize' onClick={onRandomizePrompt} /> : null}
            </div>
        </div>
        <PlayerIcon size={3} path={COMMON_ICONS.success} label='Confirm' onClick={onSubmitPromptsClick} />
    </div>
}

const Prompts = ({ prompt, onSubmitPrompt, onRandomizePrompt }: { prompt: PromptPlayerState | null, onSubmitPrompt: (value: unknown) => void, onRandomizePrompt: () => void }) => {
    return <div className={styles.prompts}>
        <TransitionGroup values={prompt ? [prompt] : []} getKey={p => p.label}>
            {props => <Prompt {...props} onSubmitPrompt={onSubmitPrompt} onRandomizePrompt={onRandomizePrompt} />}
        </TransitionGroup>
    </div>
}

const advanceEvent = createEventContext<boolean>('advance')

export const ScenePlayer = ({ state, onAdvance, onSubmitPrompt, onRandomizePrompt, onSelectOption }: { state: ScenePlayerState, onAdvance: () => void, onSubmitPrompt: (value: unknown) => void, onRandomizePrompt: () => void, onSelectOption: (index: number) => void }) => {
    const [EventProvider, dispatch] = advanceEvent.useEmitter()
    const canAdvance = !state.options.length && !state.prompt
    const latestCanAdvance = useLatest(canAdvance)

    useDOMEventListener(window, 'keydown', useCallback(e => {
        if (e.key === ' ' || e.key === 'Enter') {
            playClick()
            const shouldAdvance = dispatch(latestCanAdvance())
            if (shouldAdvance && latestCanAdvance()) onAdvance()
        } else {
            const n = parseInt(e.key, 10)
            if (!Number.isNaN(n) && n > 0) {
                playClick()
                onSelectOption(n - 1)
            }
        }
    }, [dispatch, latestCanAdvance, onAdvance, onSelectOption]))

    const onClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        playClick()
        const shouldAdvance = dispatch(latestCanAdvance())
        if (shouldAdvance && latestCanAdvance()) onAdvance()
    }, [dispatch, latestCanAdvance, onAdvance])

    return <EventProvider>
        <div className={styles.scene} onClick={onClick}>
            <div className={styles.viewbox}>
                <Backdrops backdrops={state.backdrops} />
                <Characters characters={state.characters} />
            </div>
            <Dialogue {...state.dialogue} textSpeed={state.settings.textSpeed} canAdvance={canAdvance} />
            <Options options={state.options} onSelectOption={onSelectOption} />
            <Prompts prompt={state.prompt} onSubmitPrompt={onSubmitPrompt} onRandomizePrompt={onRandomizePrompt} />
            <Song {...state.song} volume={state.settings.musicVolume} />
            <Sounds sounds={state.sounds} volume={state.settings.soundVolume} />
        </div>
    </EventProvider>
}
