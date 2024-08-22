import { useState } from 'react'
import styles from './App.module.css'
import { ExpressionEmbed } from './ExpressionEditor'
import { AnyExpr } from '../types/expressions'

export const App = () => {
    const [expr, setExpr] = useState<AnyExpr>({ type: 'format', children: [{ part: { type: 'add', left: { type: 'integer', value: 5 }, right: { type: 'number', value: 1.5 } } }, { part: { type: 'string', value: '%' } }] })

    return <div className={styles.App}>
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
    </div>
}
