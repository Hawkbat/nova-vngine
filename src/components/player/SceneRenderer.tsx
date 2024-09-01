import { useAsset } from '../../store/assets'
import { projectStore } from '../../store/project'
import type { CharacterPlayerState, BackdropPlayerState, SongPlayerState, SoundPlayerState, DialoguePlayerState, ScenePlayerState, OptionPlayerState } from '../../types/player'
import { classes } from '../../utils/display'
import { useSmoothAudio } from '../../utils/media'
import { useSelector } from '../../utils/store'
import styles from './SceneRenderer.module.css'

const Character = ({ characterID, portraitID, location }: CharacterPlayerState) => {
    const getCharacter = useSelector(projectStore, s => s.characters.find(c => c.id === characterID) ?? null)
    const getPortrait = useSelector(projectStore, s => {
        let portrait = s.portraits.find(p => p.id === portraitID)
        if (portrait && portrait.characterID !== getCharacter()?.id) {
            portrait = s.portraits.find(p => p.characterID === getCharacter()?.id && p.name === portrait?.name)
        }
        return portrait ?? null
    })
    const getImgUrl = useAsset(getPortrait()?.image ?? null)

    return <div className={styles.characterPivot}>
        {getImgUrl() ? <img src={getImgUrl() ?? undefined} className={styles.character} /> : null}
    </div>
}

const Backdrop = ({ backdropID }: BackdropPlayerState) => {
    const getBackdrop = useSelector(projectStore, s => s.backdrops.find(b => b.id === backdropID) ?? null)
    const getImgUrl = useAsset(getBackdrop()?.image ?? null)

    return getImgUrl() ? <img src={getImgUrl() ?? undefined} className={styles.backdrop} /> : null
}

const Song = ({ songID, volume }: SongPlayerState & { volume: number }) => {
    const getSong = useSelector(projectStore, s => s.songs.find(s => s.id === songID) ?? null)
    const getAudioUrl = useAsset(getSong()?.audio ?? null)
    const audioRef = useSmoothAudio({ playing: true, looping: true, volume })
    return getAudioUrl() ? <audio src={getAudioUrl() ?? undefined} ref={audioRef}  /> : null
}

const Sound = ({ soundID, volume }: SoundPlayerState & { volume: number }) => {
    const getSound = useSelector(projectStore, s => s.sounds.find(s => s.id === soundID) ?? null)
    const getAudioUrl = useAsset(getSound()?.audio ?? null)
    const audioRef = useSmoothAudio({ playing: true, volume })
    return getAudioUrl() ? <audio src={getAudioUrl() ?? undefined} ref={audioRef}  /> : null
}

const DialogueBox = ({ speakerID, speakerAlias, text }: DialoguePlayerState) => {
    const getSpeaker = useSelector(projectStore, s => s.characters.find(c => c.id === speakerID) ?? null)
    const speakerName = speakerAlias ?? getSpeaker()?.name ?? null
    return text ? <div className={styles.dialogueBox}>
        <div className={styles.dialogue}>{text}</div>
        {speakerName ? <div className={styles.speaker}>{speakerName}</div> : null}
    </div> : null
}

const Option = ({ enabled, text, index }: OptionPlayerState & { index: number }) => {
    return <div className={classes(styles.option, { [styles.enabled ?? '']: enabled })}>{index + 1}. {text}</div>
}

export const SceneRenderer = ({ state }: { state: ScenePlayerState }) => {
    return <div className={styles.scene}>
        <Backdrop {...state.backdrop} />
        <div className={styles.characters}>
            {state.characters.map(c => <Character key={c.characterID} {...c} />)}
        </div>
        <DialogueBox {...state.dialogue} />
        {state.options.length ? <div className={styles.options}>
            {state.options.map((o, i) => <Option key={i} {...o} index={i} />)}
        </div> : null}
        <Song {...state.song} volume={state.settings.musicVolume} />
        {state.sounds.map(s => <Sound key={s.soundID} {...s} volume={state.settings.soundVolume} />)}
    </div>
}
