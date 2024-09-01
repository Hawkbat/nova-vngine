import { useAsset } from '../../store/assets'
import { projectStore } from '../../store/project'
import type { RenderCharacterState, RenderBackdropState, RenderSongState, RenderSoundState, RenderDialogueState, RenderSceneState } from '../../types/player'
import { useSmoothAudio } from '../../utils/media'
import { useSelector } from '../../utils/store'
import styles from './SceneRenderer.module.css'

const Character = ({ characterID, portraitID, location }: RenderCharacterState) => {
    const character = useSelector(projectStore, s => s.characters.find(c => c.id === characterID) ?? null)
    const portrait = useSelector(projectStore, s => {
        let portrait = s.portraits.find(p => p.id === portraitID)
        if (portrait && portrait.characterID !== character?.id) {
            portrait = s.portraits.find(p => p.characterID === character?.id && p.name === portrait?.name)
        }
        return portrait ?? null
    })
    const imgUrl = useAsset(portrait?.image ?? null)

    return <div className={styles.characterPivot}>
        {imgUrl ? <img src={imgUrl} className={styles.character} /> : null}
    </div>
}

const Backdrop = ({ backdropID }: RenderBackdropState) => {
    const backdrop = useSelector(projectStore, s => s.backdrops.find(b => b.id === backdropID) ?? null)
    const imgUrl = useAsset(backdrop?.image ?? null)

    return imgUrl ? <img src={imgUrl} className={styles.backdrop} /> : null
}

const Song = ({ songID }: RenderSongState) => {
    const song = useSelector(projectStore, s => s.songs.find(s => s.id === songID) ?? null)
    const audioUrl = useAsset(song?.audio ?? null)
    const audioRef = useSmoothAudio({ playing: true, looping: true })
    return audioUrl ? <audio ref={audioRef}  /> : null
}

const Sound = ({ soundID }: RenderSoundState) => {
    const sound = useSelector(projectStore, s => s.sounds.find(s => s.id === soundID) ?? null)
    const audioUrl = useAsset(sound?.audio ?? null)
    const audioRef = useSmoothAudio({ playing: true })
    return audioUrl ? <audio ref={audioRef}  /> : null
}

const DialogueBox = ({ speakerID, speakerAlias, text }: RenderDialogueState) => {
    const speaker = useSelector(projectStore, s => s.characters.find(c => c.id === speakerID) ?? null)
    const speakerName = speakerAlias ?? speaker?.name ?? null
    return text ? <div className={styles.dialogueBox}>
        <div className={styles.dialogue}>{text}</div>
        {speakerName ? <div className={styles.speaker}>{speakerName}</div> : null}
    </div> : null
}

export const SceneRenderer = ({ state }: { state: RenderSceneState }) => {
    return <div className={styles.scene}>
        <Backdrop {...state.backdrop} />
        <div className={styles.characters}>
            {state.characters.map(c => <Character key={c.characterID} {...c} />)}
        </div>
        <DialogueBox {...state.dialogue} />
        <Song {...state.song} />
        {state.sounds.map(s => <Sound key={s.soundID} {...s} />)}
    </div>
}
