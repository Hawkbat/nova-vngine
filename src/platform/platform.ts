import { PLATFORM_FORCE } from '../debug'
import type { Platform } from '../types/platform'
import { neutralinoPlatform } from './neutralino'
import { webPlatform } from './web'

export const platforms = {
    neutralino: neutralinoPlatform,
    web: webPlatform,
}

export type PlatformType = keyof typeof platforms

function getPlatform(preferred: PlatformType | undefined = PLATFORM_FORCE): Platform {
    if (preferred && platforms[preferred].isSupported()) return platforms[preferred]
    if (neutralinoPlatform.isSupported()) return neutralinoPlatform
    if (webPlatform.isSupported()) return webPlatform
    throw new Error('No supported platforms')
}

export const platform = getPlatform()
