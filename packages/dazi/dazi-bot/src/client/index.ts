/**
 * Browser-half entry: the workspace loads `./client` from this named module,
 * while the JSX it mounts lives in `app/View.tsx`.
 */

export { apply, inject, PANEL_ID } from './app/View.js'
