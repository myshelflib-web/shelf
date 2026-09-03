export type DeleteProgressJob = {
  id: string;
  label: string;
};

type Listener = (jobs: readonly DeleteProgressJob[]) => void;

const jobs: DeleteProgressJob[] = [];
const listeners = new Set<Listener>();

function notify() {
  const snapshot = [...jobs];
  for (const listener of listeners) listener(snapshot);
}

export function getDeleteProgressJobs(): readonly DeleteProgressJob[] {
  return jobs;
}

export function subscribeDeleteProgress(listener: Listener): () => void {
  listeners.add(listener);
  listener([...jobs]);
  return () => {
    listeners.delete(listener);
  };
}

/** Start a non-blocking delete progress entry. Returns the job id. */
export function startDeleteProgress(label: string): string {
  const id = `del-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  jobs.push({ id, label });
  notify();
  return id;
}

export function finishDeleteProgress(id: string) {
  const index = jobs.findIndex((job) => job.id === id);
  if (index < 0) return;
  jobs.splice(index, 1);
  notify();
}

/** Run async delete work with a progress entry that clears when finished. */
export async function runDeleteWithProgress<T>(
  label: string,
  work: () => Promise<T>
): Promise<T> {
  const id = startDeleteProgress(label);
  try {
    return await work();
  } finally {
    finishDeleteProgress(id);
  }
}

/** Test-only: clear in-flight jobs between cases. */
export function resetDeleteProgressForTests() {
  jobs.length = 0;
  notify();
}
