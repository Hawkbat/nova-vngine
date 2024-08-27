import { PLATFORM_FORCE_CHROMIUM, PLATFORM_FORCE_WEB } from "../../debug"
import { chromiumPlatform } from "./chromium"
import type { Platform } from "./common"
import { neutralinoPlatform } from "./neutralino"
import { webPlatform } from "./web"

export function determinePlatform(): Platform {
    if (PLATFORM_FORCE_CHROMIUM) return chromiumPlatform
    if (PLATFORM_FORCE_WEB) return webPlatform
    
    if ('NL_APPID' in window) {
        return neutralinoPlatform
    }
    if ('showOpenFilePicker' in window) {
        return chromiumPlatform
    }
    return webPlatform
}

export const platform = determinePlatform()
