
declare module "*.module.css" {
    const classNames: Record<string, string>
    export default classNames
}

declare module "*.png" {
    const url: string
    export default url
}

declare module "*.svg" {
    const url: string
    export default url
}
