/**
 * Centralized string enums for every text constant in the schema.
 * Values stay strings so the serialized config remains human-readable;
 * call sites get named, type-safe members instead of magic literals.
 */

// ──────────────────────────────────────────────────────────────────────────
// Positioning (re-exported from primitives.ts as well for convenience)
// ──────────────────────────────────────────────────────────────────────────
export { Vertical, Horizontal, Edge } from './primitives';

/**
 * Positioning strategy.
 *
 *   Fixed    — pinned to the viewport (CSS `position: fixed`). Stays put as
 *              the user scrolls the page; the menu and its anchor track each
 *              other via Floating UI's autoUpdate. Default.
 *   Absolute — positioned relative to the nearest positioned ancestor;
 *              flows with the document. Use for inline menus that should
 *              scroll away with the surrounding content.
 */
export enum PositionStrategy {
	Fixed = 'fixed',
	Absolute = 'absolute',
}

/**
 * Menu lifecycle state. Surfaced through `useMenuState(id)` so the host
 * app can coordinate with menu transitions (e.g. disable a trigger while
 * its menu is closing, suppress focus traps until 'open', etc).
 *
 *   Closed   — not in the open stack at all
 *   Opening  — just registered; mount + open animation are in flight
 *   Open     — animation finished; menu is fully interactive
 *   Closing  — close() called; exit animation playing before removal
 */
export enum MenuState {
	Closed = 'closed',
	Opening = 'opening',
	Open = 'open',
	Closing = 'closing',
}

/**
 * Body scroll mode — controls overflow handling on a body region.
 *
 *   Auto — scroll only when content overflows the configured maxHeight.
 *          Default for list / grid bodies.
 *   None — no scroll; body grows to its natural size. Useful for short
 *          fixed menus where overflow shouldn't appear.
 *   Outer — the entire menu scrolls (chrome included).
 */
export enum ScrollMode {
	Auto = 'auto',
	None = 'none',
	Outer = 'outer',
}

// ──────────────────────────────────────────────────────────────────────────
// Top-level menu kind
// ──────────────────────────────────────────────────────────────────────────
export enum MenuKind {
	Menu = 'menu',
	Tooltip = 'tooltip',
	Context = 'context',
	Inline = 'inline',
}

// ──────────────────────────────────────────────────────────────────────────
// Chrome
// ──────────────────────────────────────────────────────────────────────────
export enum DimmerMode {
	Default = 'default',
	None = 'none',
	PassThrough = 'passThrough',
	Visible = 'visible',
}

export enum FilterShowWhen {
	Always = 'always',
	Auto = 'auto',
}

export enum HeaderKind {
	Default = 'default',
	SearchBar = 'searchBar',
	Custom = 'custom',
}

export enum FooterKind {
	Buttons = 'buttons',
	Add = 'add',
	JumpBar = 'jumpBar',
	Sidebar = 'sidebar',
	Custom = 'custom',
}

// ──────────────────────────────────────────────────────────────────────────
// Body
// ──────────────────────────────────────────────────────────────────────────
export enum BodyKind {
	List = 'list',
	Grid = 'grid',
	Form = 'form',
	Custom = 'custom',
	Composed = 'composed',
}

export enum SortAxis {
	X = 'x',
	Y = 'y',
	Both = 'both',
}

/**
 * List layout orientation. `Vertical` (default) stacks rows top-to-bottom;
 * `Horizontal` lays rows out left-to-right — the right shape for icon
 * toolbars, format bars, segmented controls.
 */
export enum Orientation {
	Vertical = 'vertical',
	Horizontal = 'horizontal',
}

export enum SelectionMode {
	Single = 'single',
	Multi = 'multi',
}

export enum FormLayout {
	Single = 'single',
	Double = 'double',
}

export enum ComposedScroll {
	Outer = 'outer',
	Inner = 'inner',
}

export enum GridColumns {
	Auto = 'auto',
}

// ──────────────────────────────────────────────────────────────────────────
// Rows
// ──────────────────────────────────────────────────────────────────────────
export enum RowKind {
	Item = 'item',
	Section = 'section',
	Divider = 'divider',
	Switch = 'switch',
	Checkbox = 'checkbox',
	SelectNav = 'selectNav',
	Color = 'color',
	Object = 'object',
	Add = 'add',
	Sortable = 'sortable',
	Chip = 'chip',
	FilterRule = 'filterRule',
	Participant = 'participant',
	Empty = 'empty',
	Custom = 'custom',
}

export enum ColorScope {
	Text = 'text',
	Bg = 'bg',
}

// ──────────────────────────────────────────────────────────────────────────
// Panels
// ──────────────────────────────────────────────────────────────────────────
export enum PanelKind {
	SearchInput = 'searchInput',
	TabBar = 'tabBar',
	TileGrid = 'tileGrid',
	EmojiGrid = 'emojiGrid',
	RecentStrip = 'recentStrip',
	CategoryJump = 'categoryJump',
	FileDropZone = 'fileDropZone',
	MonthGrid = 'monthGrid',
	CodeEditor = 'codeEditor',
	KatexPreview = 'katexPreview',
	QrCode = 'qrCode',
	Slider = 'slider',
	LinkPreview = 'linkPreview',
	Loader = 'loader',
	EmptyState = 'emptyState',
	Error = 'error',
	MarkdownToolbar = 'markdownToolbar',
	QueryBuilder = 'queryBuilder',
	Label = 'label',
	Divider = 'divider',
	Banner = 'banner',
	Custom = 'custom',
}

export enum BannerVariant {
	Info = 'info',
	Warning = 'warning',
	Success = 'success',
	Promo = 'promo',
}

// ──────────────────────────────────────────────────────────────────────────
// Fields
// ──────────────────────────────────────────────────────────────────────────
export enum FieldKind {
	Text = 'text',
	TextArea = 'textarea',
	Switch = 'switch',
	Checkbox = 'checkbox',
	Select = 'select',
	Color = 'color',
	Date = 'date',
	Icon = 'icon',
	File = 'file',
	Button = 'button',
	Custom = 'custom',
}

export enum TextFieldVariant {
	Plain = 'plain',
	Underlined = 'underlined',
	Card = 'card',
}

export enum TextFieldType {
	Text = 'text',
	Password = 'password',
	Email = 'email',
	Url = 'url',
	Number = 'number',
	Tel = 'tel',
}

export enum FileFieldVariant {
	DropZone = 'dropZone',
	Button = 'button',
}

export enum ButtonFieldVariant {
	Default = 'default',
	Primary = 'primary',
	Destructive = 'destructive',
	Ghost = 'ghost',
}

// ──────────────────────────────────────────────────────────────────────────
// Sources
// ──────────────────────────────────────────────────────────────────────────
export enum SourceKind {
	Static = 'static',
	Prop = 'prop',
	Store = 'store',
	Async = 'async',
	Sections = 'sections',
	Composite = 'composite',
}

export enum RefetchTrigger {
	Open = 'open',
	Filter = 'filter',
	Visibility = 'visibility',
}

// ──────────────────────────────────────────────────────────────────────────
// Sub-menus
// ──────────────────────────────────────────────────────────────────────────
export enum SubMenuTrigger {
	ArrowHover = 'arrowHover',
	ArrowClick = 'arrowClick',
	MoreIcon = 'moreIcon',
	RightClick = 'rightClick',
	LongPress = 'longPress',
	Replace = 'replace',
	Programmatic = 'programmatic',
}

export enum SubMenuAnchor {
	Parent = 'parent',
	Item = 'item',
	Cursor = 'cursor',
}

// ──────────────────────────────────────────────────────────────────────────
// Keyboard
// ──────────────────────────────────────────────────────────────────────────
export enum KeyboardNavigation {
	None = 'none',
	Linear = '1d',
	Grid2D = '2d-grid',
}

// ──────────────────────────────────────────────────────────────────────────
// Buttons & misc
// ──────────────────────────────────────────────────────────────────────────
export enum ButtonColor {
	Accent = 'accent',
	Blank = 'blank',
	Destructive = 'destructive',
}

export enum ButtonSize {
	Small = 'small',
	Medium = 'medium',
	Large = 'large',
}

export enum TooltipAxisX {
	Left = 'left',
	Center = 'center',
	Right = 'right',
}

export enum TooltipAxisY {
	Top = 'top',
	Bottom = 'bottom',
}

export enum AnalyticsEventName {
	MenuOpen = 'menuOpen',
	MenuClose = 'menuClose',
	ItemSelect = 'itemSelect',
	SubMenuOpen = 'subMenuOpen',
	Submit = 'submit',
}
