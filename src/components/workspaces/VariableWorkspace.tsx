import { Fragment } from 'react/jsx-dev-runtime'

import { getProjectExprContext, immConvertVariable } from '../../operations/project'
import { projectStore } from '../../store/project'
import { viewStateStore } from '../../store/viewstate'
import { type AnyPartialVariableDefinition, type AnyVariableScope, type ChapterID, type CharacterID, getDefaultVariableScope, type MacroID, type SceneID, type StoryID, VARIABLE_SCOPE_TYPES, VARIABLE_TYPES } from '../../types/project'
import { prettyPrintIdentifier } from '../../utils/display'
import { immAppend, immRemoveAt, immReplaceAt, immSet } from '../../utils/imm'
import { useSelector, useStore } from '../../utils/store'
import { DropdownField } from '../common/DropdownField'
import { EditorIcon } from '../common/EditorIcon'
import { EntityField } from '../common/EntityField'
import { VariableList } from '../common/EntityList'
import { Field } from '../common/Field'
import { COMMON_ICONS } from '../common/Icons'
import { ExpressionField } from '../editors/ExpressionEditor'
import { EntityWorkspace } from './EntityWorkspace'

import styles from './VariableWorkspace.module.css'

const ScopeEditor = ({ scope, setScope }: { scope: AnyVariableScope, setScope: (scope: AnyVariableScope) => void }) => {
    const [getProject] = useStore(projectStore)
    const subEditor = () => {
        switch (scope.type) {
            case 'allStories':
            case 'allChapters':
            case 'allScenes':
            case 'allCharacters':
            case 'allMacros':
                return <></>
            case 'story': return <EntityField label='Story' type='story' value={scope.value} setValue={value => setScope(immSet(scope, 'value', value))} options={getProject().stories} includeParent />
            case 'chapter': return <EntityField label='Chapter' type='chapter' value={scope.value} setValue={value => setScope(immSet(scope, 'value', value))} options={getProject().chapters} includeParent />
            case 'scene': return <EntityField label='Scene' type='scene' value={scope.value} setValue={value => setScope(immSet(scope, 'value', value))} options={getProject().scenes} includeParent />
            case 'character': return <EntityField label='Character' type='character' value={scope.value} setValue={value => setScope(immSet(scope, 'value', value))} options={getProject().characters} includeParent />
            case 'macro': return <EntityField label='Macro' type='macro' value={scope.value} setValue={value => setScope(immSet(scope, 'value', value))} options={getProject().macros} includeParent />
            case 'stories': return <Field label='Stories'>
                {scope.value.map((s, i) => <Fragment key={s} >
                    <EditorIcon path={COMMON_ICONS.deleteItem} label='Remove Item' onClick={() => setScope(immSet(scope, 'value', immRemoveAt(scope.value, i)))} />
                    <EntityField value={s} setValue={value => setScope(immSet(scope, 'value', immReplaceAt(scope.value, i, value)))} type='story' options={getProject().stories} includeParent />
                </Fragment>)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' onClick={() => setScope(immSet(scope, 'value', immAppend(scope.value, '' as StoryID)))} />
            </Field>
            case 'chapters': return <Field label='Chapters'>
                {scope.value.map((s, i) => <Fragment key={s} >
                    <EditorIcon path={COMMON_ICONS.deleteItem} label='Remove Item' onClick={() => setScope(immSet(scope, 'value', immRemoveAt(scope.value, i)))} />
                    <EntityField value={s} setValue={value => setScope(immSet(scope, 'value', immReplaceAt(scope.value, i, value)))} type='chapter' options={getProject().chapters} includeParent />
                </Fragment>)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' onClick={() => setScope(immSet(scope, 'value', immAppend(scope.value, '' as ChapterID)))} />
            </Field>
            case 'scenes': return <Field label='Scenes'>
                {scope.value.map((s, i) => <Fragment key={s} >
                    <EditorIcon path={COMMON_ICONS.deleteItem} label='Remove Item' onClick={() => setScope(immSet(scope, 'value', immRemoveAt(scope.value, i)))} />
                    <EntityField value={s} setValue={value => setScope(immSet(scope, 'value', immReplaceAt(scope.value, i, value)))} type='scene' options={getProject().scenes} includeParent />
                </Fragment>)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' onClick={() => setScope(immSet(scope, 'value', immAppend(scope.value, '' as SceneID)))} />
            </Field>
            case 'characters': return <Field label='Character'>
                {scope.value.map((s, i) => <Fragment key={s} >
                    <EditorIcon path={COMMON_ICONS.deleteItem} label='Remove Item' onClick={() => setScope(immSet(scope, 'value', immRemoveAt(scope.value, i)))} />
                    <EntityField value={s} setValue={value => setScope(immSet(scope, 'value', immReplaceAt(scope.value, i, value)))} type='character' options={getProject().characters} includeParent />
                </Fragment>)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' onClick={() => setScope(immSet(scope, 'value', immAppend(scope.value, '' as CharacterID)))} />
            </Field>
            case 'macros': return <Field label='Macros'>
                {scope.value.map((s, i) => <Fragment key={s} >
                    <EditorIcon path={COMMON_ICONS.deleteItem} label='Remove Item' onClick={() => setScope(immSet(scope, 'value', immRemoveAt(scope.value, i)))} />
                    <EntityField value={s} setValue={value => setScope(immSet(scope, 'value', immReplaceAt(scope.value, i, value)))} type='macro' options={getProject().macros} includeParent />
                </Fragment>)}
                <EditorIcon path={COMMON_ICONS.addItem} label='Add Item' onClick={() => setScope(immSet(scope, 'value', immAppend(scope.value, '' as MacroID)))} />
            </Field>
        }
    }
    return <>
        <DropdownField label='Scope' value={scope.type} setValue={t => setScope(getDefaultVariableScope(t))} options={VARIABLE_SCOPE_TYPES} format={t => prettyPrintIdentifier(t)} />
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
    const [getProject] = useStore(projectStore)
    const ctx = getProjectExprContext()
    const isVariableSelected = useSelector(viewStateStore, s => !!s.scopes.variable)

    return isVariableSelected() ? <EntityWorkspace type='variable'>{(variable, setVariable) => <>
        <ScopeEditor scope={variable.scope} setScope={s => setVariable(v => immSet(v, 'scope', s))} />
        <DropdownField label='Variable Type' value={variable.type} setValue={t => setVariable(v => immConvertVariable(v, t))} options={VARIABLE_TYPES} format={t => prettyPrintIdentifier(t)} />
        <PartialVariableEditor variable={variable} setVariable={pv => setVariable(v => ({ ...v, ...pv(v) }))} />
        <ExpressionField label='Default Value' value={variable.default} setValue={expr => setVariable(v => immSet(v, 'default', expr))} ctx={ctx} />
    </>}</EntityWorkspace> : <div className={styles.fields}>
        <VariableList scope={{ type: 'allStories' }} />
        <VariableList scope={{ type: 'stories', value: getProject().stories.map(s => s.id) }} />
        {getProject().stories.map(s => <VariableList key={s.id} scope={{ type: 'story', value: s.id }} hideEmpty />)}
        <VariableList scope={{ type: 'allChapters' }} />
        <VariableList scope={{ type: 'chapters', value: getProject().chapters.map(s => s.id) }} />
        {getProject().chapters.map(s => <VariableList key={s.id} scope={{ type: 'chapter', value: s.id }} hideEmpty />)}
        <VariableList scope={{ type: 'allScenes' }} />
        <VariableList scope={{ type: 'scenes', value: getProject().scenes.map(s => s.id) }} />
        {getProject().scenes.map(s => <VariableList key={s.id} scope={{ type: 'scene', value: s.id }} hideEmpty />)}
        <VariableList scope={{ type: 'allCharacters' }} />
        <VariableList scope={{ type: 'characters', value: getProject().characters.map(s => s.id) }} />
        {getProject().characters.map(s => <VariableList key={s.id} scope={{ type: 'character', value: s.id }} hideEmpty />)}
        <VariableList scope={{ type: 'allMacros' }} />
        <VariableList scope={{ type: 'macros', value: getProject().macros.map(s => s.id) }} />
        {getProject().macros.map(s => <VariableList key={s.id} scope={{ type: 'macro', value: s.id }} hideEmpty />)}
    </div>
}
