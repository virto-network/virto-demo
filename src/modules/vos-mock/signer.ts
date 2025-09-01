import {
    DEV_PHRASE,
    entropyToMiniSecret,
    mnemonicToEntropy,
    ss58Encode,
} from "@polkadot-labs/hdkd-helpers";

import { getPolkadotSigner } from "polkadot-api/signer";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import { ConfigService } from "../../config/config.service";

// Create config service instance to get the seed
const configService = new ConfigService();

const entropy = mnemonicToEntropy(configService.getPhrase() || DEV_PHRASE);
const seed = entropyToMiniSecret(entropy);
const derive = sr25519CreateDerive(seed);


// Example usage for generating a sr25519 keypair with hard derivation
const keyPair = derive(configService.getDerivePath() || "");
const publicKey = keyPair.publicKey;

export const polkadotSigner = getPolkadotSigner(
    publicKey,
    "Sr25519",
    keyPair.sign
);
export const publicAddress = ss58Encode(polkadotSigner.publicKey);
