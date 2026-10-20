"use client";

import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { useApi } from "use-hook-api";
import { getDistributorStatsApi } from "@/api/retailer";
import {
  retailerAudienceChannelSelectionAtomFamily,
  type RetailerAudienceChannelSelectionScope,
} from "@/store/retailerAudienceChannel";

export interface AudienceChannel {
  channel_id: string;
  name: string;
  channel_type: string;
  status: string;
  is_completed?: boolean;
  salesforce_channel_id?: string;
  channel_salesforce_id?: string;
}

export interface Audience {
  audience_id: string;
  name: string;
  channels: AudienceChannel[];
}

export interface UseAudienceChannelOptions {
  targetChannelId?: string | null;
}

export interface UseAudienceChannelReturn {
  audiences: Audience[];
  selectedAudienceId: string | null;
  selectedChannelId: string | null;
  selectedAudience: Audience | undefined;
  refreshKey: number;
  loading: boolean;
  error: unknown;
  setSelectedChannelId: (id: string | null) => void;
  handleAudienceChange: (audienceId: string) => void;
  refresh: () => void;
}

export function useAudienceChannel(
  scope: RetailerAudienceChannelSelectionScope,
  options?: UseAudienceChannelOptions,
): UseAudienceChannelReturn {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selection, setSelection] = useAtom(
    retailerAudienceChannelSelectionAtomFamily(scope),
  );
  const selectedAudienceId = selection.audienceId;
  const selectedChannelId = selection.channelId;

  const targetChannelId = options?.targetChannelId;
  const appliedTargetChannelIdRef = useRef<string | null>(null);

  const [callFetch, { apiLoading: loading, data: audienceData, error }] = useApi({
    errMsg: true,
    cache: "audience_channel",
  });

  useEffect(() => {
    if (!targetChannelId) {
      appliedTargetChannelIdRef.current = null;
    }
  }, [targetChannelId]);

  useEffect(() => {
    if (!audienceData) {
      return;
    }
    const accountData = audienceData?.data ?? audienceData;
    const audienceList: Audience[] = accountData?.audiences ?? [];
    setAudiences([...audienceList]);

    if (audienceList.length === 0) {
      setSelection({ audienceId: null, channelId: null });
      return;
    }

    // 1. If targetChannelId is provided and hasn't been applied yet, prioritize finding matching audience and channel
    if (targetChannelId && appliedTargetChannelIdRef.current !== targetChannelId) {
      const tid = targetChannelId.trim().toLowerCase();
      let matchedAudience: Audience | null = null;
      let matchedChannel: AudienceChannel | null = null;

      for (const aud of audienceList) {
        const found = aud.channels.find(
          (c) =>
            c.channel_id?.toLowerCase() === tid ||
            (c as any).salesforce_channel_id?.toLowerCase() === tid ||
            (c as any).channel_salesforce_id?.toLowerCase() === tid ||
            (c as any).salesforce_id?.toLowerCase() === tid ||
            c.name?.toLowerCase() === tid ||
            c.channel_type?.toLowerCase() === tid
        );
        if (found) {
          matchedAudience = aud;
          matchedChannel = found;
          break;
        }
      }

      if (matchedAudience && matchedChannel) {
        appliedTargetChannelIdRef.current = targetChannelId;
        setSelection({
          audienceId: matchedAudience.audience_id,
          channelId: matchedChannel.channel_id,
        });
        return;
      } else {
        appliedTargetChannelIdRef.current = targetChannelId;
      }
    }

    const nextAudience =
      audienceList.find(
        (audience) => audience.audience_id === selectedAudienceId,
      ) ?? audienceList[0];

    const preferredChannelId =
      nextAudience.audience_id === selectedAudienceId
        ? selectedChannelId
        : null;

    const nextChannelId =
      nextAudience.channels.find(
        (channel) => channel.channel_id === preferredChannelId,
      )?.channel_id ??
      nextAudience.channels[0]?.channel_id ??
      null;

    setSelection({
      audienceId: nextAudience.audience_id,
      channelId: nextChannelId,
    });
  }, [audienceData, selectedAudienceId, selectedChannelId, targetChannelId, setSelection]);

  const fetchAudiences = () => {
    callFetch(getDistributorStatsApi(true));
  };

  useEffect(() => {
    fetchAudiences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Let each page refresh its own APIs in place without a browser reload.
  const refresh = () => {
    fetchAudiences();
    setRefreshKey((current) => current + 1);
  };

  const updateSelectedChannelId = (id: string | null) => {
    setSelection({
      audienceId: selectedAudienceId,
      channelId: id,
    });
  };

  const handleAudienceChange = (audienceId: string) => {
    const audience = audiences.find((a) => a.audience_id === audienceId);
    const nextChannelId = audience?.channels[0]?.channel_id ?? null;
    setSelection({
      audienceId,
      channelId: nextChannelId,
    });
  };

  const selectedAudience = audiences.find(
    (a) => a.audience_id === selectedAudienceId,
  );

  return {
    audiences,
    selectedAudienceId,
    selectedChannelId,
    selectedAudience,
    refreshKey,
    loading,
    error,
    setSelectedChannelId: updateSelectedChannelId,
    handleAudienceChange,
    refresh,
  };
}
