/**
 * Northstar Connected Care — Chapter Three structured content (BC-006).
 */

import {
  assembleNorthstarChapter,
  type NorthstarChapterEntities,
} from "./northstar-chapter-assembler";
import { CHAPTER_3_CATALOG } from "./northstar-chapter-catalogs";

export type { NorthstarChapterEntities };

export const buildNorthstarChapterThreeEntities =
  (): NorthstarChapterEntities => assembleNorthstarChapter(CHAPTER_3_CATALOG);
