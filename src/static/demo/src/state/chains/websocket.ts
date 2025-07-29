import { JsonRpcProvider } from "@polkadot-api/substrate-client"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"

export interface WebsocketSource {
  type: "websocket"
  id: string
  endpoint: string
}



export function getWebsocketProvider(source: WebsocketSource): JsonRpcProvider {
  return withPolkadotSdkCompat(getWsProvider(source.endpoint))
}
