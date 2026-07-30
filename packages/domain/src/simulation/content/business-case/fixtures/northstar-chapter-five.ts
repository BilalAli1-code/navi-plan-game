/**
 * Northstar Connected Care — Chapter Five structured content (BC-006).
 */

import {
  assembleNorthstarChapter,
  type NorthstarChapterEntities,
} from "./northstar-chapter-assembler";
import { CHAPTER_5_CATALOG } from "./northstar-chapter-catalogs";

export type { NorthstarChapterEntities };

export const buildNorthstarChapterFiveEntities = (): NorthstarChapterEntities =>
  assembleNorthstarChapter(CHAPTER_5_CATALOG);
