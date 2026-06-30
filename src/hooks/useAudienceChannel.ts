"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useApi } from "use-hook-api";
import { getDistributorStatsApi } from "@/api/retailer";

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

export function useAudienceChannel(): UseAudienceChannelReturn {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(
    null,
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );

  const [callFetch, { loading, data: audienceData, error }] = useApi({
    errMsg: true,
    cache: "audience_channel",
  });

  useEffect(() => {
    if (!audienceData) {
      return;
    }
    const accountData = audienceData?.data ?? audienceData;
    const audienceList: Audience[] = accountData?.audiences ?? [];
    setAudiences(audienceList);
    if (audienceList.length > 0) {
      const first = audienceList[0];
      setSelectedAudienceId(first.audience_id);
      setSelectedChannelId(first.channels[0]?.channel_id ?? null);
    }
  }, [audienceData]);

  const refresh = () => {
    callFetch(getDistributorStatsApi(true));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAudienceChange = (audienceId: string) => {
    setSelectedAudienceId(audienceId);
    const audience = audiences.find((a) => a.audience_id === audienceId);
    setSelectedChannelId(audience?.channels[0]?.channel_id ?? null);
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
    setSelectedChannelId,
    handleAudienceChange,
    refresh,
  };
}
