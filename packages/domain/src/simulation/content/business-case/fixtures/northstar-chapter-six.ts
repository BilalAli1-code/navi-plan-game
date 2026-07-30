/**
 * Northstar Connected Care — Chapter Six structured content (BC-006).
 */

import {
  assembleNorthstarChapter,
  type NorthstarChapterEntities,
} from "./northstar-chapter-assembler";
import { CHAPTER_6_CATALOG } from "./northstar-chapter-catalogs";

export type { NorthstarChapterEntities };

export const buildNorthstarChapterSixEntities = (): NorthstarChapterEntities =>
  assembleNorthstarChapter(CHAPTER_6_CATALOG);
