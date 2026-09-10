export type { IntentCluster } from "./intentClustersCore";
export { INTENT_CLUSTERS_CORE } from "./intentClustersCore";
export { INTENT_CLUSTERS_MORE } from "./intentClustersMore";
export { INTENT_CLUSTERS_STUDY_TOOLS } from "./intentClustersStudyTools";
export { INTENT_CLUSTERS_TRAFFIC } from "./intentClustersTraffic";
import { INTENT_CLUSTERS_CORE } from "./intentClustersCore";
import { INTENT_CLUSTERS_MORE } from "./intentClustersMore";
import { INTENT_CLUSTERS_STUDY_TOOLS } from "./intentClustersStudyTools";
import { INTENT_CLUSTERS_TRAFFIC } from "./intentClustersTraffic";

export const INTENT_CLUSTERS = [
  ...INTENT_CLUSTERS_CORE,
  ...INTENT_CLUSTERS_STUDY_TOOLS,
  ...INTENT_CLUSTERS_TRAFFIC,
  ...INTENT_CLUSTERS_MORE,
];
