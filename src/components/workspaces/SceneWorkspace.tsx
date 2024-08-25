import { useState } from "react"
import { projectStore } from "../../store/project"
import { SceneID } from "../../types/definitions"
import { useSelector } from "../../utils/store"
import { AnyExpr, createDefaultExpr } from "../../types/expressions"
import { ExpressionEmbed } from "../editors/ExpressionEditor"

export const SceneWorkspace = ({}: {}) => {
    const [sceneID, setSceneID] = useState('' as SceneID)
    const [scene, setProject] = useSelector(projectStore, s => s.scenes.find(i => i.id === sceneID))
    
    const [expr, setExpr] = useState<AnyExpr>(createDefaultExpr('unset'))
    
    return <>
        <span>
            This is a first line of text with a lot of content in it so it will extend above the expression editor
            <br />
            This is an expression in the middle of
            <ExpressionEmbed expr={expr} setExpr={setExpr} />
            a large body of text
            <br />
            with a line break in it right about here so it will be sandwiched between text lines
            <br />
            A final line to show the line spacing is even
        </span>
    </>
}
