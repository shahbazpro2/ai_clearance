import { atomFamily, atomWithStorage, createJSONStorage } from "jotai/utils";

export interface RetailerAudienceChannelSelection {
  audienceId: string | null;
  channelId: string | null;
}

export type RetailerAudienceChannelSelectionScope =
  | "block-categories"
  | "distribution-centers"
  | "order-management"
  | "projection-shipment-logs";

const AUDIENCE_CHANNEL_SELECTION_KEY = "retailer:audience-channel-selection";

const selectionStorage = createJSONStorage<RetailerAudienceChannelSelection>(
  () => sessionStorage,
);

export const retailerAudienceChannelSelectionAtomFamily = atomFamily(
  (scope: RetailerAudienceChannelSelectionScope) =>
    atomWithStorage<RetailerAudienceChannelSelection>(
      `${AUDIENCE_CHANNEL_SELECTION_KEY}:${scope}`,
      {
        audienceId: null,
        channelId: null,
      },
      selectionStorage,
    ),
);
