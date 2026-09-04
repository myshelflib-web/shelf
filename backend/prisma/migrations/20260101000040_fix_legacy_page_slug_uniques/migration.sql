-- Data-preserving: DROP INDEX only. No DELETE/UPDATE of UserTopic or storage keys.
--
-- Legacy slug uniques from loose_library_pages treated every folderId-only file as a
-- "root" row (userSubjectId/userTopicGroupId NULL), so the same slug in different
-- folders collided. Folder-scoped uniques from 20260101000030 already enforce
-- uniqueness correctly and are left in place:
--   UserTopic_root_userId_slug_folder_key  (folderId IS NULL)
--   UserTopic_folder_slug_key              (folderId IS NOT NULL)
--
-- Existing pages keep their folderId / legacy FKs / pdfKey / contentUrl unchanged.

DROP INDEX IF EXISTS "UserTopic_root_userId_slug_key";
DROP INDEX IF EXISTS "UserTopic_notebook_subjectId_slug_key";
DROP INDEX IF EXISTS "UserTopic_topic_groupId_slug_key";
