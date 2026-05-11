/**
 * Lifecycle hooks. The runtime invokes these in order:
 *   1. onBeforeOpen   — synchronous, can mutate `param.data` or veto open
 *   2. onMount        — first render committed; return cleanup like useEffect
 *   3. onOpen         — body has measured + positioned (next frame)
 *   4. onChange       — value changes (form / selection)
 *   5. onSelect       — user committed a selection (Enter / click)
 *   6. onSubmit       — form submission
 *   7. onBeforeClose  — synchronous, can veto close
 *   8. onClose        — fully unmounted
 *
 * Errors thrown in lifecycle hooks are surfaced to the provider's `onError`.
 */

import type { MenuCtx } from './context';

export interface LifecycleConfig<TData = any, TValue = any> {
	onBeforeOpen?: (ctx: MenuCtx<TData>) => boolean | void;
	onMount?: (ctx: MenuCtx<TData>) => void | (() => void);
	onOpen?: (ctx: MenuCtx<TData>) => void;
	onChange?: (value: TValue, ctx: MenuCtx<TData>) => void;
	onSelect?: (value: TValue, ctx: MenuCtx<TData>) => void;
	onSubmit?: (value: TValue, ctx: MenuCtx<TData>) => void | Promise<void>;
	onBeforeClose?: (ctx: MenuCtx<TData>) => boolean | void;
	onClose?: (ctx: MenuCtx<TData>) => void;
	onError?: (error: unknown, ctx: MenuCtx<TData>) => void;
}
