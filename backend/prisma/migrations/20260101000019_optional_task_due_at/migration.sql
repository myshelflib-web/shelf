-- Unscheduled planner items (To plan backlog)
ALTER TABLE "StudyTask" ALTER COLUMN "dueAt" DROP NOT NULL;
