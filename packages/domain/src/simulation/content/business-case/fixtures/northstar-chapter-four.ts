/**
 * Northstar Connected Care — Chapter Four structured content (BC-006).
 */

import {
  assembleNorthstarChapter,
  type NorthstarChapterEntities,
} from "./northstar-chapter-assembler";
import { CHAPTER_4_CATALOG } from "./northstar-chapter-catalogs";

export type { NorthstarChapterEntities };

export const buildNorthstarChapterFourEntities = (): NorthstarChapterEntities =>
  assembleNorthstarChapter(CHAPTER_4_CATALOG);
