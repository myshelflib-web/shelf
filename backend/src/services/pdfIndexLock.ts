/** One pdf.js document at a time — Ask + the index worker must not overlap. */
let chain: Promise<unknown> = Promise.resolve();

export function withPdfIndexLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn) as Promise<T>;
  chain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
