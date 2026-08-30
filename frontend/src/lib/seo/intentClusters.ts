export type { IntentCluster } from "./intentClustersCore";
export { INTENT_CLUSTERS_CORE } from "./intentClustersCore";
export { INTENT_CLUSTERS_MORE } from "./intentClustersMore";
import { INTENT_CLUSTERS_CORE } from "./intentClustersCore";
import { INTENT_CLUSTERS_MORE } from "./intentClustersMore";

export const INTENT_CLUSTERS = [
  ...INTENT_CLUSTERS_CORE,
  ...INTENT_CLUSTERS_MORE,
];
