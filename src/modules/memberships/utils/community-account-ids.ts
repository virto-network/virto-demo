import { ApiPromise } from "@polkadot/api";
import { blake2AsU8a, encodeAddress } from "@polkadot/util-crypto";

const KREIVO_PARACHAIN_ID = 2281;

export async function communityAccountInKreivo(
  api: ApiPromise,
  communityId: number
): Promise<string> {
  const communityIdBytes = api.createType("u32", communityId).toU8a();
  const prefix = new TextEncoder().encode("modlpy/communi");
  const combined = new Uint8Array(prefix.length + communityIdBytes.length);
  combined.set(prefix);
  combined.set(communityIdBytes, prefix.length);
  
  const hash = blake2AsU8a(combined, 256);
  return encodeAddress(hash, 2);
}

export async function sovereignAccountForCommunityInRelay(
  api: ApiPromise,
  communityId: number,
  format: "string" | "u8a" = "string"
): Promise<string | Uint8Array> {
  const communityIdBytes = api.createType("u32", communityId).toU8a();
  const prefix = new TextEncoder().encode("para");
  const parachainId = api.createType("u32", KREIVO_PARACHAIN_ID).toU8a();
  
  const combined = new Uint8Array(prefix.length + parachainId.length + communityIdBytes.length);
  combined.set(prefix);
  combined.set(parachainId, prefix.length);
  combined.set(communityIdBytes, prefix.length + parachainId.length);
  
  const hash = blake2AsU8a(combined, 256);
  
  if (format === "u8a") {
    return hash;
  }
  
  return encodeAddress(hash, 2);
}

export async function sovereignAccountForCommunityInSibling(
  api: ApiPromise,
  communityId: number,
  format: "string" | "u8a" = "string"
): Promise<string | Uint8Array> {
  const communityIdBytes = api.createType("u32", communityId).toU8a();
  const prefix = new TextEncoder().encode("sibl");
  const parachainId = api.createType("u32", KREIVO_PARACHAIN_ID).toU8a();
  
  const combined = new Uint8Array(prefix.length + parachainId.length + communityIdBytes.length);
  combined.set(prefix);
  combined.set(parachainId, prefix.length);
  combined.set(communityIdBytes, prefix.length + parachainId.length);
  
  const hash = blake2AsU8a(combined, 256);
  
  if (format === "u8a") {
    return hash;
  }
  
  return encodeAddress(hash, 2);
} 