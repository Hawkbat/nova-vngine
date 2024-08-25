import { useState } from "react"
import { immCreateScene } from "../../store/project"
import { AnyExpr, createDefaultExpr } from "../../types/expressions"
import { ExpressionEmbed } from "../editors/ExpressionEditor"
import { SceneDefinition } from "../../types/definitions"
import { EntityWorkspace } from "./EntityWorkspace"
import styles from "./SceneWorkspace.module.css"

const SceneEditor = ({ scene }: { scene: SceneDefinition }) => {
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

export const SceneWorkspace = () => {
    return <EntityWorkspace type='scene' immCreate={immCreateScene}>{scene => <SceneEditor scene={scene} />}</EntityWorkspace>
}
