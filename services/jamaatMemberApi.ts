'use client';

import { Auxiliary, JamaatMember, Participant } from '../types';
import { JAMAAT_MEMBER_DATABASE } from './mockData';

export interface MemberVerification {
  status: Participant['verificationStatus'];
  details: string;
  member?: JamaatMember;
}

export interface JamaatMemberApi {
  verifyMember(memberId: string, auxiliary: Auxiliary): Promise<MemberVerification>;
  lookupMember(memberId: string): Promise<JamaatMember | null>;
}

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// MOCK implementation — active now. The central Jama'at member API is not
// ready yet, so verification runs against the local registry in mockData.ts.
// ---------------------------------------------------------------------------
const mockJamaatMemberApi: JamaatMemberApi = {
  async verifyMember(memberId: string): Promise<MemberVerification> {
    await delay(250);
    const cleanId = memberId.trim().toUpperCase();
    if (!cleanId || cleanId.length < 3) {
      return { status: 'Invalid', details: 'Member ID format is invalid' };
    }

    const found = JAMAAT_MEMBER_DATABASE.find((m) => m.memberId.toUpperCase() === cleanId);
    if (!found) {
      return { status: 'Not Found', details: 'Member ID not found in Central Jamaat Registry' };
    }

    if (found.status !== 'Active') {
      return {
        status: 'Verification Failed',
        details: 'Member record is inactive or suspended',
        member: found,
      };
    }

    return {
      status: 'Verified',
      details: `Active verified member (${found.auxiliary} - ${found.dila}, ${found.jamaat})`,
      member: found,
    };
  },

  async lookupMember(memberId: string): Promise<JamaatMember | null> {
    await delay(100);
    const cleanId = memberId.trim().toUpperCase();
    return JAMAAT_MEMBER_DATABASE.find((m) => m.memberId.toUpperCase() === cleanId) || null;
  },
};

// ---------------------------------------------------------------------------
// LIVE implementation — activates automatically once the real API is ready.
// Just set NEXT_PUBLIC_JAMAAT_API_URL (see .env.example). Nothing else in
// the app needs to change: every caller goes through `jamaatMemberApi`.
// ---------------------------------------------------------------------------
const LIVE_TIMEOUT_MS = 10000;

async function liveFetch<T>(path: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_JAMAAT_API_URL!.replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Jama'at API responded with ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

const liveJamaatMemberApi: JamaatMemberApi = {
  async verifyMember(memberId: string, auxiliary: Auxiliary): Promise<MemberVerification> {
    const cleanId = memberId.trim().toUpperCase();
    if (!cleanId || cleanId.length < 3) {
      return { status: 'Invalid', details: 'Member ID format is invalid' };
    }

    // TODO(backend): confirm the real endpoint + response shape with the
    // API owner, then adjust the mapping below. Expected shape:
    // { fullName, auxiliary, dila, ilaqa?, jamaat, phone?, email?, status: 'Active' | 'Inactive' }
    const member = await liveFetch<JamaatMember>(
      `/members/${encodeURIComponent(cleanId)}?auxiliary=${encodeURIComponent(auxiliary)}`
    );

    if (!member) {
      return { status: 'Not Found', details: 'Member ID not found in Central Jamaat Registry' };
    }
    if (member.status !== 'Active') {
      return {
        status: 'Verification Failed',
        details: 'Member record is inactive or suspended',
        member,
      };
    }
    return {
      status: 'Verified',
      details: `Active verified member (${member.auxiliary} - ${member.dila}, ${member.jamaat})`,
      member,
    };
  },

  async lookupMember(memberId: string): Promise<JamaatMember | null> {
    const cleanId = memberId.trim().toUpperCase();
    try {
      // TODO(backend): confirm the real endpoint with the API owner.
      return await liveFetch<JamaatMember>(`/members/${encodeURIComponent(cleanId)}`);
    } catch {
      return null;
    }
  },
};

// Switches to live the moment the URL is configured. Until then: mock.
export const jamaatMemberApi: JamaatMemberApi =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_JAMAAT_API_URL
    ? liveJamaatMemberApi
    : mockJamaatMemberApi;

export const isLiveJamaatApi = (): boolean =>
  typeof process !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_JAMAAT_API_URL);
