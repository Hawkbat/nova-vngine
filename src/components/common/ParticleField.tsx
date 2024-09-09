import { useCallback, useRef } from 'react'

import { useAnimationLoop } from '../../utils/hooks'
import { lerp } from '../../utils/math'

import styles from './ParticleField.module.css'

const DENSITY = 160 * 160
const SPEED = 5
const MIN_SIZE = 5
const MAX_SIZE = 20
const MAX_COUNT = 256

interface Particle {
    el: HTMLDivElement
    anim: Animation | null
}

interface ParticleContext {
    w: number
    h: number
}

function spawnParticle(parent: HTMLElement, ctx: ParticleContext): Particle {
    const el = document.createElement('div')
    el.classList.add(styles.particle ?? '')
    parent.append(el)
    const particle: Particle = { el, anim: null }
    return emitParticle(particle, ctx, true)
}

function emitParticle(p: Particle, ctx: ParticleContext, first: boolean = false): Particle {
    const x = Math.random() * ctx.w
    const y = Math.random() * ctx.h
    const s = MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE)
    const [dx, dy] = Math.random() > 0.5 ? [Math.sign(Math.random() - 0.5), 0] : [0, Math.sign(Math.random() - 0.5)]
    const t = 5 + Math.random() * 10
    const tx = x + dx * t * SPEED * (MAX_SIZE / s)
    const ty = y + dy * t * SPEED * (MAX_SIZE / s)
    if (p.anim) {
        p.anim.onfinish = null
        p.anim.cancel()
    }
    const anim = p.el.animate([
        {
            transform: `translate(${String(x)}px, ${String(y)}px) scale(${String(s)})`,
            opacity: 0,
        },
        {
            transform: `translate(${String(lerp(0.5, x, tx))}px, ${String(lerp(0.5, y, ty))}px) scale(${String(s)})`,
            opacity: 1,
        },
        {
            transform: `translate(${String(tx)}px, ${String(ty)}px) scale(${String(s)})`,
            opacity: 0,
        },
    ], {
        duration: t * 1000,
        easing: 'linear',
    })
    anim.onfinish = () => {
        emitParticle(p, ctx)
        anim.onfinish = null
        if (p.anim === anim) p.anim = null
    }
    p.anim = anim
    return p
}

export const ParticleField = () => {
    const ref = useRef<HTMLDivElement>(null)
    const sizeRef = useRef<ParticleContext>({ w: 0, h: 0 })
    const particlesRef = useRef<Particle[]>([])
    useAnimationLoop(true, useCallback(() => {
        if (ref.current) {
            const size = sizeRef.current
            size.w = ref.current.offsetWidth
            size.h = ref.current.offsetHeight
            const goalCount = Math.round(size.w * size.h / DENSITY)
            const particles = particlesRef.current
            while (particles.length < goalCount && particles.length < MAX_COUNT) {
                particles.push(spawnParticle(ref.current, size))
            }
            particles.slice(0, Math.min(goalCount, MAX_COUNT)).forEach(p => {
                if (p.anim === null) emitParticle(p, size)
            })
        }
    }, []))
    return <div ref={ref} className={styles.field}></div>
}
