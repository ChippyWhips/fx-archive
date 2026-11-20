/**
 * Shared JSDoc types. This file exports nothing at runtime.
 *
 * @typedef {'canvas2d'|'webgl'|'three'|'css'} Renderer
 * @typedef {'overlay'|'sidebar'} ControlsLayout
 * @typedef {'article'|'tutorial'|'example'|'history'} SourceKind
 *
 * @typedef {object} EffectParameter
 * @property {string} name
 * @property {string} what plain description of what it does
 * @property {'lock'|'expose'} lock suggestion for a client-facing tool
 *
 * @typedef {object} EffectSource
 * @property {string} title
 * @property {string} url
 * @property {SourceKind} kind
 *
 * @typedef {object} Effect
 * @property {string} slug
 * @property {string} name
 * @property {string[]} synonyms
 * @property {string} collection
 * @property {string[]} tags
 * @property {string} oneLiner
 * @property {string} whatItIs plain-text paragraphs, blank-line separated
 * @property {Renderer} renderer
 * @property {boolean} motionDependent
 * @property {ControlsLayout} controlsLayout
 * @property {EffectParameter[]} parameters
 * @property {string[]} related
 * @property {EffectSource[]} sources
 * @property {string} poster
 *
 * @typedef {Effect & { index: number, servedOn: string, served: boolean }} ScheduledEffect
 */

export {};
