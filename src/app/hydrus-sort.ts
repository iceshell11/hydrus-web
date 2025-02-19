import { HydrusTagDisplayType } from "./hydrus-tags";

export enum HydrusSortType {
  FileSize = 0,
  Duration = 1,
  ImportTime = 2,
  MIME = 3,
  Random = 4,
  Width = 5,
  Height = 6,
  Ratio = 7,
  NumPixels = 8,
  NumTags = 9,
  MediaViews = 10,
  MediaViewtime = 11,
  ApproxBitrate = 12,
  HasAudio = 13,
  FileModifiedTimestamp = 14,
  Framerate = 15,
  NumFrames = 16,
  NumCollectionFiles = 17, //Not used in API
  LastViewedTime = 18,
  ArchivedTimestamp = 19,
  Hash = 20,
  PixelHash = 21,
  Blurhash = 22,
  AverageColourLightness = 23,
  AverageColourChromaticMagnitude = 24,
  AverageColourChromaticityGreenRed = 25,
  AverageColourChromaticityBlueYellow = 26,
  AverageColourHue = 27,
}

const SORT_FILES_BY_FILESIZE = HydrusSortType.FileSize,
SORT_FILES_BY_DURATION = HydrusSortType.Duration,
SORT_FILES_BY_IMPORT_TIME = HydrusSortType.ImportTime,
SORT_FILES_BY_MIME = HydrusSortType.MIME,
SORT_FILES_BY_RANDOM = HydrusSortType.Random,
SORT_FILES_BY_WIDTH = HydrusSortType.Width,
SORT_FILES_BY_HEIGHT = HydrusSortType.Height,
SORT_FILES_BY_RATIO = HydrusSortType.Ratio,
SORT_FILES_BY_NUM_PIXELS = HydrusSortType.NumPixels,
SORT_FILES_BY_NUM_TAGS = HydrusSortType.NumTags,
SORT_FILES_BY_MEDIA_VIEWS = HydrusSortType.MediaViews,
SORT_FILES_BY_MEDIA_VIEWTIME = HydrusSortType.MediaViewtime,
SORT_FILES_BY_APPROX_BITRATE = HydrusSortType.ApproxBitrate,
SORT_FILES_BY_HAS_AUDIO = HydrusSortType.HasAudio,
SORT_FILES_BY_FILE_MODIFIED_TIMESTAMP = HydrusSortType.FileModifiedTimestamp,
SORT_FILES_BY_FRAMERATE = HydrusSortType.Framerate,
SORT_FILES_BY_NUM_FRAMES = HydrusSortType.NumFrames,
SORT_FILES_BY_NUM_COLLECTION_FILES = HydrusSortType.NumCollectionFiles,
SORT_FILES_BY_LAST_VIEWED_TIME = HydrusSortType.LastViewedTime,
SORT_FILES_BY_ARCHIVED_TIMESTAMP = HydrusSortType.ArchivedTimestamp,
SORT_FILES_BY_HASH = HydrusSortType.Hash,
SORT_FILES_BY_PIXEL_HASH = HydrusSortType.PixelHash,
SORT_FILES_BY_BLURHASH = HydrusSortType.Blurhash,
SORT_FILES_BY_AVERAGE_COLOUR_LIGHTNESS = HydrusSortType.AverageColourLightness,
SORT_FILES_BY_AVERAGE_COLOUR_CHROMATIC_MAGNITUDE = HydrusSortType.AverageColourChromaticMagnitude,
SORT_FILES_BY_AVERAGE_COLOUR_CHROMATICITY_GREEN_RED = HydrusSortType.AverageColourChromaticityGreenRed,
SORT_FILES_BY_AVERAGE_COLOUR_CHROMATICITY_BLUE_YELLOW = HydrusSortType.AverageColourChromaticityBlueYellow,
SORT_FILES_BY_AVERAGE_COLOUR_HUE = HydrusSortType.AverageColourHue;


export enum SortMetaType {
  Collections = 'collections',
  Dimensions = 'dimensions',
  Duration = 'duration',
  File = 'file',
  Tags = 'tags',
  Time = 'time',
  Views = 'views',
  AverageColor = 'average color'
}

// https://github.com/hydrusnetwork/hydrus/blob/89383614cfb135622a62b0d56999e425cfe366f9/hydrus/client/media/ClientMedia.py#L2248
function canAsc(sortType: HydrusSortType) {
  return ![SORT_FILES_BY_MIME, SORT_FILES_BY_RANDOM].includes(sortType);
}

const sortMetaTypeGroups: Record<SortMetaType, HydrusSortType[]> = {
  [SortMetaType.AverageColor]: [
    SORT_FILES_BY_AVERAGE_COLOUR_CHROMATICITY_BLUE_YELLOW,
    SORT_FILES_BY_AVERAGE_COLOUR_CHROMATICITY_GREEN_RED,
    SORT_FILES_BY_AVERAGE_COLOUR_CHROMATIC_MAGNITUDE,
    SORT_FILES_BY_AVERAGE_COLOUR_HUE,
    SORT_FILES_BY_AVERAGE_COLOUR_LIGHTNESS,
  ],
  [SortMetaType.Collections]: [
    SORT_FILES_BY_NUM_COLLECTION_FILES
  ],
  [SortMetaType.Dimensions]: [
    SORT_FILES_BY_HEIGHT,
    SORT_FILES_BY_WIDTH,
    SORT_FILES_BY_NUM_PIXELS,
    SORT_FILES_BY_RATIO,
  ],
  [SortMetaType.Duration]: [
    SORT_FILES_BY_DURATION,
    SORT_FILES_BY_FRAMERATE,
    SORT_FILES_BY_NUM_FRAMES
  ],
  [SortMetaType.File]: [
    SORT_FILES_BY_APPROX_BITRATE,
    SORT_FILES_BY_FILESIZE,
    SORT_FILES_BY_MIME,
    SORT_FILES_BY_HAS_AUDIO,
    SORT_FILES_BY_HASH,
    SORT_FILES_BY_PIXEL_HASH,
    SORT_FILES_BY_BLURHASH,
  ],
  [SortMetaType.Tags]: [
    SORT_FILES_BY_NUM_TAGS
  ],
  [SortMetaType.Time]: [
    SORT_FILES_BY_ARCHIVED_TIMESTAMP,
    SORT_FILES_BY_IMPORT_TIME,
    SORT_FILES_BY_LAST_VIEWED_TIME,
    SORT_FILES_BY_FILE_MODIFIED_TIMESTAMP
  ],
  [SortMetaType.Views]: [
    SORT_FILES_BY_MEDIA_VIEWS,
    SORT_FILES_BY_MEDIA_VIEWTIME,
  ]
}

const sort_type_basic_string_lookup: Record<HydrusSortType, string> = {
  [SORT_FILES_BY_DURATION] : 'duration',
  [SORT_FILES_BY_FRAMERATE] : 'framerate',
  [SORT_FILES_BY_NUM_FRAMES] : 'number of frames',
  [SORT_FILES_BY_HEIGHT] : 'height',
  [SORT_FILES_BY_NUM_COLLECTION_FILES] : 'number of files in collection',
  [SORT_FILES_BY_NUM_PIXELS] : 'number of pixels',
  [SORT_FILES_BY_AVERAGE_COLOUR_LIGHTNESS] : 'lightness',
  [SORT_FILES_BY_AVERAGE_COLOUR_CHROMATIC_MAGNITUDE] : 'chromatic magnitude',
  [SORT_FILES_BY_AVERAGE_COLOUR_CHROMATICITY_GREEN_RED] : 'balance - green-red',
  [SORT_FILES_BY_AVERAGE_COLOUR_CHROMATICITY_BLUE_YELLOW] : 'balance - blue-yellow',
  [SORT_FILES_BY_AVERAGE_COLOUR_HUE] : 'hue',
  [SORT_FILES_BY_RATIO] : 'resolution ratio',
  [SORT_FILES_BY_WIDTH] : 'width',
  [SORT_FILES_BY_APPROX_BITRATE] : 'approximate bitrate',
  [SORT_FILES_BY_FILESIZE] : 'filesize',
  [SORT_FILES_BY_MIME] : 'filetype',
  [SORT_FILES_BY_HAS_AUDIO] : 'has audio',
  [SORT_FILES_BY_IMPORT_TIME] : 'import time',
  [SORT_FILES_BY_FILE_MODIFIED_TIMESTAMP] : 'modified time',
  [SORT_FILES_BY_ARCHIVED_TIMESTAMP] : 'archived time',
  [SORT_FILES_BY_LAST_VIEWED_TIME] : 'last viewed time',
  [SORT_FILES_BY_RANDOM] : 'random',
  [SORT_FILES_BY_HASH] : 'hash - sha256',
  [SORT_FILES_BY_PIXEL_HASH] : 'hash - pixel hash',
  [SORT_FILES_BY_BLURHASH] : 'hash - blurhash',
  [SORT_FILES_BY_NUM_TAGS] : 'number of tags',
  [SORT_FILES_BY_MEDIA_VIEWS] : 'media views',
  [SORT_FILES_BY_MEDIA_VIEWTIME] : 'media viewtime',
}

const SORT_ASC = true, SORT_DESC = false;

const sort_string_lookup: Record<HydrusSortType, [string, string, boolean]> = {
  [ SORT_FILES_BY_APPROX_BITRATE ] : [ 'smallest first', 'largest first', SORT_DESC ],
  [ SORT_FILES_BY_FILESIZE ] : [ 'smallest first', 'largest first', SORT_DESC ],
  [ SORT_FILES_BY_DURATION ] : [ 'shortest first', 'longest first', SORT_DESC ],
  [ SORT_FILES_BY_FRAMERATE ] : [ 'slowest first', 'fastest first', SORT_DESC ],
  [ SORT_FILES_BY_NUM_COLLECTION_FILES ] : [ 'fewest first', 'most first', SORT_DESC ],
  [ SORT_FILES_BY_NUM_FRAMES ] : [ 'smallest first', 'largest first', SORT_DESC ],
  [ SORT_FILES_BY_HAS_AUDIO ] : [ 'audio first', 'silent first', SORT_ASC ],
  [ SORT_FILES_BY_IMPORT_TIME ] : [ 'oldest first', 'newest first', SORT_DESC ],
  [ SORT_FILES_BY_FILE_MODIFIED_TIMESTAMP ] : [ 'oldest first', 'newest first', SORT_DESC ],
  [ SORT_FILES_BY_LAST_VIEWED_TIME ] : [ 'oldest first', 'newest first', SORT_DESC ],
  [ SORT_FILES_BY_ARCHIVED_TIMESTAMP ] : [ 'oldest first', 'newest first', SORT_DESC ],
  [ SORT_FILES_BY_MIME ] : [ 'filetype', 'filetype', SORT_ASC ],
  [ SORT_FILES_BY_RANDOM ] : [ 'random', 'random', SORT_ASC ],
  [ SORT_FILES_BY_HASH ] : [ 'lexicographic', 'reverse lexicographic', SORT_ASC ],
  [ SORT_FILES_BY_PIXEL_HASH ] : [ 'lexicographic', 'reverse lexicographic', SORT_ASC ],
  [ SORT_FILES_BY_BLURHASH ] : [ 'lexicographic', 'reverse lexicographic', SORT_ASC ],
  [ SORT_FILES_BY_AVERAGE_COLOUR_LIGHTNESS ] : [ 'darkest first', 'lightest first', SORT_ASC ],
  [ SORT_FILES_BY_AVERAGE_COLOUR_CHROMATIC_MAGNITUDE ] : [ 'greys first', 'colours first', SORT_ASC ],
  [ SORT_FILES_BY_AVERAGE_COLOUR_CHROMATICITY_GREEN_RED ] : [ 'greens first', 'reds first', SORT_ASC ],
  [ SORT_FILES_BY_AVERAGE_COLOUR_CHROMATICITY_BLUE_YELLOW ] : [ 'blues first', 'yellows first', SORT_ASC ],
  [ SORT_FILES_BY_AVERAGE_COLOUR_HUE ] : [ 'rainbow - red first', 'rainbow - purple first', SORT_ASC ],
  [ SORT_FILES_BY_WIDTH ] : [ 'slimmest first', 'widest first', SORT_ASC ],
  [ SORT_FILES_BY_HEIGHT ] : [ 'shortest first', 'tallest first', SORT_ASC ],
  [ SORT_FILES_BY_RATIO ] : [ 'tallest first', 'widest first', SORT_ASC ],
  [ SORT_FILES_BY_NUM_PIXELS ] : [ 'ascending', 'descending', SORT_DESC ],
  [ SORT_FILES_BY_NUM_TAGS ] : [ 'ascending', 'descending', SORT_ASC ],
  [ SORT_FILES_BY_MEDIA_VIEWS ] : [ 'ascending', 'descending', SORT_DESC ],
  [ SORT_FILES_BY_MEDIA_VIEWTIME ] : [ 'ascending', 'descending', SORT_DESC ]
}

interface DisplaySortType {
  sortType: HydrusSortType;
  basicString: string;
  sortOrder: SortOrderInfo;
  //sortOrder: [string, string, boolean];
  //canAsc: boolean;
}

interface DisplaySortMetaTypeGroup {
  metaType: SortMetaType;
  sortTypes: DisplaySortType[];
}

function processSortType(sortType: HydrusSortType): DisplaySortType {
  return {
    sortType,
    basicString: sort_type_basic_string_lookup[sortType],
    //sortOrder: sort_string_lookup[sortType],
    //canAsc: canAsc(sortType)
    sortOrder: getSortOrderInfo(sortType)
  }
}

function processMetaTypeGroup(metaType: SortMetaType): DisplaySortMetaTypeGroup {
  const st = sortMetaTypeGroups[metaType];
  return {
    metaType,
    sortTypes: st.map(processSortType)
  }
}

export const displaySortGroups = [
  processMetaTypeGroup(SortMetaType.AverageColor),
  processMetaTypeGroup(SortMetaType.Dimensions),
  processMetaTypeGroup(SortMetaType.Duration),
  processMetaTypeGroup(SortMetaType.File),
  processSortType(HydrusSortType.Random),
  processMetaTypeGroup(SortMetaType.Tags),
  processMetaTypeGroup(SortMetaType.Time),
  processMetaTypeGroup(SortMetaType.Views)
]

export function isDisplaySortMetaTypeGroup(g: DisplaySortType | DisplaySortMetaTypeGroup): g is DisplaySortMetaTypeGroup {
  return 'metaType' in g;
}

export function isDisplaySortType(g: DisplaySortType | DisplaySortMetaTypeGroup): g is DisplaySortType {
  return 'sortType' in g;
}

export const defaultSortType = HydrusSortType.ImportTime;
export const defaultAscending = false;

interface SortOrderInfo {
  ascString: string;
  descString: string;
  defaultAsc: boolean;
  canAsc: boolean;
}

export function getSortOrderInfo(sortType: HydrusSortType): SortOrderInfo {
  const [ascString, descString, defaultAsc] = sort_string_lookup[sortType];
  return {
    ascString,
    descString,
    defaultAsc,
    canAsc: canAsc(sortType)
  }
}

export interface SortInfo {
  sortType: HydrusSortType;
  sortAsc: boolean;
}

export const defaultSort: SortInfo = {
  sortType: defaultSortType,
  sortAsc: defaultAscending
}

export function sortToString({sortType, sortAsc}: SortInfo) {
  const name = sort_type_basic_string_lookup[sortType];
  const orderInfo = getSortOrderInfo(sortType);
  const orderString = sortAsc ? orderInfo.ascString : orderInfo.descString;
  return `${name}${orderInfo.canAsc ? ' (' + orderString + ')' : ''}`;
}

enum HydrusMediaSortOrder {
  SORT_ASC = 0,
  SORT_DESC = 1
}

enum HydrusSortMetaType {
  System = 'system',
  Namespaces = 'namespaces',
  Rating = 'rating',
}

interface HydrusTagContext {
  service_key: string;
  include_current_tags: boolean;
  include_pending_tags: boolean;
  display_service_key: boolean;
}

interface HydrusMediSortBase {
  sort_metatype: HydrusSortMetaType;
  sort_order: HydrusMediaSortOrder;
  tag_context: HydrusTagContext
}

export interface HydrusMediaSortSystem extends HydrusMediSortBase {
  sort_metatype: HydrusSortMetaType.System;
  sort_type: HydrusSortType;
}

export interface HydrusMediaSortNamespaces extends HydrusMediSortBase {
  sort_metatype: HydrusSortMetaType.Namespaces;
  namespaces: Array<string>;
  tag_display_type: HydrusTagDisplayType;
}

export interface HydrusMediaSortRating extends HydrusMediSortBase {
  sort_metatype: HydrusSortMetaType.Rating;
  service_key: string;
}

export type HydrusMediaSort = HydrusMediaSortSystem | HydrusMediaSortNamespaces | HydrusMediaSortRating;
