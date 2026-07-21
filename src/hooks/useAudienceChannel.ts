"use client";

import { useEffect } from "react";
import { useState } from "react";
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
}

export interface Audience {
  audience_id: string;
  name: string;
  channels: AudienceChannel[];
}

export interface UseAudienceChannelReturn {
  audiences: Audience[];
  selectedAudienceId: string | null;
  selectedChannelId: string | null;
  selectedAudience: Audience | undefined;
  loading: boolean;
  error: unknown;
  setSelectedChannelId: (id: string | null) => void;
  handleAudienceChange: (audienceId: string) => void;
  refresh: () => void;
}

export function useAudienceChannel(
  scope: RetailerAudienceChannelSelectionScope,
): UseAudienceChannelReturn {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [selection, setSelection] = useAtom(
    retailerAudienceChannelSelectionAtomFamily(scope),
  );
  const selectedAudienceId = selection.audienceId;
  const selectedChannelId = selection.channelId;

  const [callFetch, { apiLoading: loading, data: audienceData, error }] = useApi({
    errMsg: true,
    cache: "audience_channel",
  });

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
  }, [audienceData, selectedAudienceId, selectedChannelId, setSelection]);

  const refresh = () => {
    callFetch(getDistributorStatsApi(true));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    loading,
    error,
    setSelectedChannelId: updateSelectedChannelId,
    handleAudienceChange,
    refresh,
  };
}
