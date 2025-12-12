import { fetchViaProxy, calculateSimilarity } from "./utils";
import { API_CONFIG } from "./config";

const METADATA_KEYWORDS = [
  "歌词贡献者",
  "翻译贡献者",
  "作词",
  "作曲",
  "编曲",
  "制作",
  "词曲",
  "词 / 曲",
  "lyricist",
  "composer",
  "arrange",
  "translation",
  "translator",
  "producer",
];

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const metadataKeywordRegex = new RegExp(
  `^(${METADATA_KEYWORDS.map(escapeRegex).join("|")})\\s*[:：]`,
  "iu",
);

const TIMESTAMP_REGEX = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;

interface NeteaseApiArtist {
  name?: string;
}

interface NeteaseApiAlbum {
  name?: string;
  picUrl?: string;
}

interface NeteaseApiSong {
  id: number;
  name?: string;
  ar?: NeteaseApiArtist[];
  al?: NeteaseApiAlbum;
  dt?: number;
}

interface NeteaseSearchResponse {
  result?: {
    songs?: NeteaseApiSong[];
  };
}

interface NeteasePlaylistResponse {
  songs?: NeteaseApiSong[];
}

interface NeteaseSongDetailResponse {
  code?: number;
  songs?: NeteaseApiSong[];
}

export interface NeteaseTrackInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl?: string;
  duration?: number;
  isNetease: true;
  neteaseId: string;
}

type SearchOptions = {
  limit?: number;
  offset?: number;
};

const formatArtists = (artists?: NeteaseApiArtist[]) =>
  (artists ?? [])
    .map((artist) => artist.name?.trim())
    .filter(Boolean)
    .join("/") || "";

const mapNeteaseSongToTrack = (song: NeteaseApiSong): NeteaseTrackInfo => ({
  id: song.id.toString(),
  title: song.name?.trim() ?? "",
  artist: formatArtists(song.ar),
  album: song.al?.name?.trim() ?? "",
  coverUrl: song.al?.picUrl?.replaceAll("http:", "https:"),
  duration: song.dt,
  isNetease: true,
  neteaseId: song.id.toString(),
});

const isMetadataTimestampLine = (line: string): boolean => {
  const trimmed = line.trim();
  const match = trimmed.match(TIMESTAMP_REGEX);
  if (!match) return false;
  const content = match[4].trim();
  return metadataKeywordRegex.test(content);
};

const parseTimestampMetadata = (line: string) => {
  const match = line.trim().match(TIMESTAMP_REGEX);
  return match ? match[4].trim() : line.trim();
};

const isMetadataJsonLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return false;
  try {
    const json = JSON.parse(trimmed);
    if (json.c && Array.isArray(json.c)) {
      const content = json.c.map((item: any) => item.tx || "").join("");
      return metadataKeywordRegex.test(content);
    }
  } catch {
    // ignore invalid json
  }
  return false;
};

const parseJsonMetadata = (line: string) => {
  try {
    const json = JSON.parse(line.trim());
    if (json.c && Array.isArray(json.c)) {
      return json.c
        .map((item: any) => item.tx || "")
        .join("")
        .trim();
    }
  } catch {
    // ignore
  }
  return line.trim();
};

const extractMetadataLines = (content: string) => {
  const metadataSet = new Set<string>();
  const bodyLines: string[] = [];

  content.split("\n").forEach((line) => {
    if (!line.trim()) return;
    if (isMetadataTimestampLine(line)) {
      metadataSet.add(parseTimestampMetadata(line));
    } else if (isMetadataJsonLine(line)) {
      metadataSet.add(parseJsonMetadata(line));
    } else {
      bodyLines.push(line);
    }
  });

  return {
    clean: bodyLines.join("\n").trim(),
    metadata: Array.from(metadataSet),
  };
};

export const getNeteaseAudioUrl = (id: string) => {
  return `${API_CONFIG.METING_API_URL}?type=url&id=${id}`;
};


// Implements the search logic from the user provided code snippet
export const searchNetEase = async (
  keyword: string,
  options: SearchOptions = {},
): Promise<NeteaseTrackInfo[]> => {
  const { limit = 20, offset = 0 } = options;
  const searchApiUrl = `${API_CONFIG.NETEASE_SEARCH_API}?keywords=${encodeURIComponent(
    keyword,
  )}&limit=${limit}&offset=${offset}`;

  try {
    const parsedSearchApiResponse = (await fetchViaProxy(
      searchApiUrl,
    )) as NeteaseSearchResponse;
    const songs = parsedSearchApiResponse.result?.songs ?? [];

    if (songs.length === 0) {
      return [];
    }

    return songs.map(mapNeteaseSongToTrack);
  } catch (error) {
    console.error("NetEase search error", error);
    return [];
  }
};

export const fetchNeteasePlaylist = async (
  playlistId: string,
): Promise<NeteaseTrackInfo[]> => {
  try {
    // 使用網易雲音樂 API 獲取歌單所有歌曲
    // 由於接口限制，需要分頁獲取，每次獲取 50 首
    const allTracks: NeteaseTrackInfo[] = [];
    const limit = 50;
    let offset = 0;
    let shouldContinue = true;

    while (shouldContinue) {
      const url = `${API_CONFIG.NETEASE_BASE_URL}/playlist/track/all?id=${playlistId}&limit=${limit}&offset=${offset}`;
      const data = (await fetchViaProxy(url)) as NeteasePlaylistResponse;
      const songs = data.songs ?? [];
      if (songs.length === 0) {
        break;
      }

      const tracks = songs.map(mapNeteaseSongToTrack);

      allTracks.push(...tracks);

      // Continue fetching if the current page was full
      if (songs.length < limit) {
        shouldContinue = false;
      } else {
        offset += limit;
      }
    }

    return allTracks;
  } catch (e) {
    console.error("Playlist fetch error", e);
    return [];
  }
};

export const fetchNeteaseSong = async (
  songId: string,
): Promise<NeteaseTrackInfo | null> => {
  try {
    const url = `${API_CONFIG.NETEASE_BASE_URL}/song/detail?ids=${songId}`;
    const data = (await fetchViaProxy(
      url,
    )) as NeteaseSongDetailResponse;
    const track = data.songs?.[0];
    if (data.code === 200 && track) {
      return mapNeteaseSongToTrack(track);
    }
    return null;
  } catch (e) {
    console.error("Song fetch error", e);
    return null;
  }
};

// Keeps the old search for lyric matching fallbacks
export const searchAndMatchLyrics = async (
  title: string,
  artist: string,
): Promise<{ lrc: string; yrc?: string; tLrc?: string; metadata: string[] } | null> => {
  try {
    // Increase limit to find better matches
    const songs = await searchNetEase(`${title} ${artist}`, { limit: 5 });

    if (songs.length === 0) {
      console.warn("No songs found on Cloud");
      return null;
    }

    // Fuzzy Match: Find best match based on title/artist similarity
    let bestMatch = songs[0];
    let bestScore = -1;

    const targetTitle = title.toLowerCase().trim();
    const targetArtist = artist.toLowerCase().trim();

    for (const song of songs) {
      const songTitle = song.title.toLowerCase().trim();
      const songArtist = song.artist.toLowerCase().trim();

      // Simple keyword check first
      if (songTitle === targetTitle && songArtist.includes(targetArtist)) {
        bestScore = 2.0; // Perfect match
        bestMatch = song;
        break;
      }

      const titleSim = calculateSimilarity(targetTitle, songTitle);
      const artistSim = calculateSimilarity(targetArtist, songArtist);

      // Weighted score: Title is more important
      const score = titleSim * 0.6 + artistSim * 0.4;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = song;
      }
    }

    // If best score is too low, reject
    if (bestScore < 0.4) {
      console.warn(`No good match found for ${title} - ${artist} (Best score: ${bestScore})`);
      return null;
    }

    const songId = bestMatch.id;
    console.log(`Found Song ID: ${songId} (Score: ${bestScore.toFixed(2)})`);

    const lyricsResult = await fetchLyricsById(songId);
    return lyricsResult;
  } catch (error) {
    console.error("Cloud lyrics match failed:", error);
    return null;
  }
};

export const fetchLyricsById = async (
  songId: string,
): Promise<{ lrc: string; yrc?: string; tLrc?: string; metadata: string[] } | null> => {
  try {
    // 使用網易雲音樂 API 獲取歌詞
    const lyricUrl = `${API_CONFIG.NETEASE_BASE_URL}/lyric/new?id=${songId}`;
    const lyricData = await fetchViaProxy(lyricUrl);

    // Check for "no lyric" flags (Pure Music / Instrumental)
    if (lyricData.nolyric || lyricData.uncollected) {
      return {
        lrc: "[00:00.00] Instrumental",
        metadata: ["纯音乐，请欣赏"],
      };
    }

    const rawYrc = lyricData.yrc?.lyric;
    const rawLrc = lyricData.lrc?.lyric;
    const tLrc = lyricData.tlyric?.lyric;

    if (!rawYrc && !rawLrc) return null;

    // Double check content for "Pure Music" indicators in text
    if (rawLrc && (rawLrc.includes("纯音乐，请欣赏") || rawLrc.includes("Pure Music"))) {
      return {
        lrc: "[00:00.00] Instrumental",
        metadata: ["纯音乐，请欣赏"],
      };
    }

    const {
      clean: cleanLrc,
      metadata: lrcMetadata,
    } = rawLrc
        ? extractMetadataLines(rawLrc)
        : { clean: undefined, metadata: [] };

    const {
      clean: cleanYrc,
      metadata: yrcMetadata,
    } = rawYrc
        ? extractMetadataLines(rawYrc)
        : { clean: undefined, metadata: [] };

    // Extract metadata from translation if available
    let cleanTranslation: string | undefined;
    let translationMetadata: string[] = [];
    if (tLrc) {
      const result = extractMetadataLines(tLrc);
      cleanTranslation = result.clean;
      translationMetadata = result.metadata;
    }

    const metadataSet = Array.from(
      new Set([...lrcMetadata, ...yrcMetadata, ...translationMetadata]),
    );

    if (lyricData.transUser?.nickname) {
      metadataSet.unshift(`翻译贡献者: ${lyricData.transUser.nickname}`);
    }

    if (lyricData.lyricUser?.nickname) {
      metadataSet.unshift(`歌词贡献者: ${lyricData.lyricUser.nickname}`);
    }

    const baseLyrics = cleanLrc || cleanYrc || rawLrc || rawYrc;
    if (!baseLyrics) return null;

    const yrcForEnrichment = cleanYrc && cleanLrc ? cleanYrc : undefined;
    return {
      lrc: baseLyrics,
      yrc: yrcForEnrichment,
      tLrc: cleanTranslation,
      metadata: Array.from(metadataSet),
    };
  } catch (e) {
    console.error("Lyric fetch error", e);
    return null;
  }
};
