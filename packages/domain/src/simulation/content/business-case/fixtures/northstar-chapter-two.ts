/**
 * Northstar Connected Care — Chapter Two structured content (BC-006).
 */

import {
  assembleNorthstarChapter,
  type NorthstarChapterEntities,
} from "./northstar-chapter-assembler";
import { CHAPTER_2_CATALOG } from "./northstar-chapter-catalogs";

export type { NorthstarChapterEntities };

export const buildNorthstarChapterTwoEntities = (): NorthstarChapterEntities =>
  assembleNorthstarChapter(CHAPTER_2_CATALOG);
