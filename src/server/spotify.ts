interface AlbumBase {
	album_type: "album" | "single" | "compilation"
	available_markets: string[]
	copyrights: Copyright[]
	external_ids: ExternalIds
	external_urls: ExternalUrls
	genres: string[]
	href: string
	id: string
	images: Image[]
	label: string
	name: string
	popularity: number
	release_date: string
	release_date_precision: "year" | "month" | "day"
	restrictions?: Restrictions
	total_tracks: number
	type: string
	uri: string
}

export interface Copyright {
	text: string
	type: string
}

export interface Page<TItemType> {
	href: string
	items: TItemType[]
	limit: number
	next: string | null
	offset: number
	previous: string | null
	total: number
}

export interface ExternalIds {
	isrc: string
	ean: string
	upc: string
}

export interface Restrictions {
	reason: string
}

export interface ExternalUrls {
	spotify: string
}

export interface Image {
	url: string
	height: number | null
	width: number | null
}

export interface SpotifyAlbum extends AlbumBase {
	artists: SimplifiedArtist[]
	tracks: Page<SimplifiedTrack>
}

export interface SimplifiedArtist {
	external_urls: ExternalUrls
	href: string
	id: string
	name: string
	type: string
	uri: string
}

export interface SimplifiedTrack {
	artists: SimplifiedArtist[]
	available_markets: string[]
	disc_number: number
	duration_ms: number
	episode: boolean
	explicit: boolean
	external_urls: ExternalUrls
	href: string
	id: string
	is_local: boolean
	name: string
	preview_url: string | null
	track: boolean
	track_number: number
	type: string
	uri: string
	is_playable?: boolean
	linked_from?: LinkedFrom
	restrictions?: Restrictions
}

export interface SimplifiedAlbum extends AlbumBase {
	album_group: string
	artists: SimplifiedArtist[]
}

export interface LinkedFrom {
	external_urls: ExternalUrls
	href: string
	id: string
	type: string
	uri: string
}
