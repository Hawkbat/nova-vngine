import { getEntityDisplayName, getProjectExprContext, immConvertVariable } from '../../store/operations'
import { projectStore } from '../../store/project'
import { type AnyPartialVariableDefinition, type AnyVariableScope, type ChapterID, type CharacterID, getDefaultVariableScope, type MacroID, type SceneID, type StoryID, VARIABLE_SCOPE_TYPES, VARIABLE_TYPES } from '../../types/project'
import { prettyPrintIdentifier } from '../../utils/display'
import { immAppend, immSet } from '../../utils/imm'
import { useStore } from '../../utils/store'
import { DropdownField } from '../common/DropdownField'
import { EditorIcon } from '../common/EditorIcon'
import { Field } from '../common/Field'
import { COMMON_ICONS } from '../common/Icons'
import { ExpressionField } from '../editors/ExpressionEditor'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './VariableWorkspace.module.css'

const ScopeEditor = ({ value, setValue }: { value: AnyVariableScope, setValue: (scope: AnyVariableScope) => void }) => {
    const [getProject] = useStore(projectStore)
    const subEditor = () => {
        switch (value.type) {
            case 'allStories':
            case 'allChapters':
            case 'allScenes':
            case 'allCharacters':
            case 'allMacros':
                return <></>
            case 'story': return <DropdownField label='Story' value={value.value} options={getProject().stories.map(s => getEntityDisplayName('story', s, false))} />
            case 'chapter': return <DropdownField label='Chapter' value={value.value} options={getProject().chapters.map(s => getEntityDisplayName('chapter', s, true))} />
            case 'scene': return <DropdownField label='Scene' value={value.value} options={getProject().scenes.map(s => getEntityDisplayName('scene', s, true))} />
            case 'character': return <DropdownField label='Character' value={value.value} options={getProject().characters.map(s => getEntityDisplayName('character', s, false))} />
            case 'macro': return <DropdownField label='Macro' value={value.value} options={getProject().macros.map(s => getEntityDisplayName('macro', s, false))} />
            case 'stories': return <Field label='Stories'>
                {value.value.map(s => <DropdownField key={s} value={s} options={getProject().stories.map(s => getEntityDisplayName('story', s, false))} />)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' onClick={() => setValue(immSet(value, 'value', immAppend(value.value, '' as StoryID)))} />
            </Field>
            case 'chapters': return <Field label='Chapters'>
                {value.value.map(s => <DropdownField key={s} value={s} options={getProject().chapters.map(s => getEntityDisplayName('chapter', s, true))} />)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' onClick={() => setValue(immSet(value, 'value', immAppend(value.value, '' as ChapterID)))} />
            </Field>
            case 'scenes': return <Field label='Scenes'>
                {value.value.map(s => <DropdownField key={s} value={s} options={getProject().scenes.map(s => getEntityDisplayName('scene', s, true))} />)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' onClick={() => setValue(immSet(value, 'value', immAppend(value.value, '' as SceneID)))} />
            </Field>
            case 'characters': return <Field label='Character'>
                {value.value.map(s => <DropdownField key={s} value={s} options={getProject().characters.map(s => getEntityDisplayName('character', s, true))} />)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' onClick={() => setValue(immSet(value, 'value', immAppend(value.value, '' as CharacterID)))} />
            </Field>
            case 'macros': return <Field label='Macros'>
                {value.value.map(s => <DropdownField key={s} value={s} options={getProject().macros.map(s => getEntityDisplayName('macro', s, true))} />)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' onClick={() => setValue(immSet(value, 'value', immAppend(value.value, '' as MacroID)))} />
            </Field>
        }
    }
    return <>
        <DropdownField label='Scope' value={value.type} setValue={t => setValue(getDefaultVariableScope(t))} options={VARIABLE_SCOPE_TYPES} format={t => prettyPrintIdentifier(t)} />
        {subEditor()}
    </>
}

const PartialVariableEditor = ({ variable, setVariable }: { variable: AnyPartialVariableDefinition, setVariable: (setter: (value: AnyPartialVariableDefinition) => AnyPartialVariableDefinition) => void }) => {
    const ctx = getProjectExprContext()

    return <>
        {variable.type === 'flag' ? <>
            <ExpressionField label='Label If Set' value={variable.setValueLabel} setValue={expr => setVariable(v => v.type === 'flag' ? immSet(v, 'setValueLabel', expr) : v)} ctx={ctx} />
            <ExpressionField label='Label If Not Set' value={variable.unsetValueLabel} setValue={expr => setVariable(v => v.type === 'flag' ? immSet(v, 'unsetValueLabel', expr) : v)} ctx={ctx} />
        </> : variable.type === 'singleChoice' ? <>
            <ExpressionField label='Options' value={variable.options} setValue={expr => setVariable(v => v.type === 'singleChoice' ? immSet(v, 'options', expr) : v)} ctx={ctx} />
        </> : variable.type === 'multipleChoice' ? <>
            <ExpressionField label='Options' value={variable.options} setValue={expr => setVariable(v => v.type === 'multipleChoice' ? immSet(v, 'options', expr) : v)} ctx={ctx} />
        </> : variable.type === 'list' ? <>
            <PartialVariableEditor variable={variable.elements} setVariable={pv => setVariable(v => v.type === 'list' ? immSet(v, 'elements', pv(v.elements)) : v)} />
        </> : variable.type === 'lookup' ? <>
            <PartialVariableEditor variable={variable.keys} setVariable={pv => setVariable(v => v.type === 'lookup' ? immSet(v, 'keys', pv(v.elements)) : v)} />
            <PartialVariableEditor variable={variable.elements} setVariable={pv => setVariable(v => v.type === 'lookup' ? immSet(v, 'elements', pv(v.elements)) : v)} />
        </> : null}
    </>
}

export const VariableWorkspace = () => {
    const ctx = getProjectExprContext()

    return <EntityWorkspace type='variable'>{(variable, setVariable) => <>
        <ScopeEditor value={variable.scope} setValue={s => setVariable(v => immSet(v, 'scope', s))} />
        <DropdownField label='Variable Type' value={variable.type} setValue={t => setVariable(v => immConvertVariable(v, t))} options={VARIABLE_TYPES} format={t => prettyPrintIdentifier(t)} />
        <PartialVariableEditor variable={variable} setVariable={pv => setVariable(v => ({ ...v, ...pv(v) }))} />
        <ExpressionField label='Default Value' value={variable.default} setValue={expr => setVariable(v => immSet(v, 'default', expr))} ctx={ctx} />
    </>}</EntityWorkspace>
}
