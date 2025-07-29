import { BinaryDisplay } from "@/codec-components/LookupTypeEdit"
import { ButtonGroup } from "@/components/ButtonGroup"
import { LoadingMetadata } from "@/components/Loading"
import { withSubscribe } from "@/components/withSuspense"

import {
  localRuntimeCtx$,
} from "@/state/chains/chain.state"
import {
  CodecComponentType,
  CodecComponentValue,
} from "@polkadot-api/react-builder"
import { Binary } from "@polkadot-api/substrate-bindings"
import { state, useStateObservable } from "@react-rxjs/core"
import { useState, useEffect } from "react"
import { map } from "rxjs"
import { twMerge } from "tailwind-merge"
import { EditMode } from "./EditMode"
import { JsonMode } from "./JsonMode"

const buildExtrinsicValue = (preConfigured: any) => {
  try {
    let methodValue: any = {};
    
    if (preConfigured.pallet === 'Balances' && preConfigured.method === 'transfer_keep_alive') {
      methodValue = {
        dest: { type: "Id", value: preConfigured.args.dest },
        value: preConfigured.args.value 
      };
    } else if (preConfigured.pallet === 'System' && preConfigured.method === 'remark') {
      methodValue = {
        remark: preConfigured.args.remark
      };
    } else if (preConfigured.pallet === 'Utility' && preConfigured.method === 'batch_all') {
      methodValue = {
        calls: preConfigured.args.calls
      };
    } else {
      methodValue = preConfigured.args;
    }

    const extrinsicValue = {
      type: preConfigured.pallet,
      value: {
        type: preConfigured.method,
        value: methodValue
      }
    };

    
    console.log('Built extrinsic value:', extrinsicValue);
    
    return {
      encoded: undefined,
      decoded: extrinsicValue,
      empty: false as const
    };
  } catch (error) {
    console.error('Error in buildExtrinsicValue:', error);
    return null;
  }
};

const extractExtrinsicData = (componentValue: CodecComponentValue): {
  pallet: string;
  method: string;
  args: Record<string, any>;
} | null => {
  try {
    if (componentValue.type !== CodecComponentType.Updated || componentValue.value.empty) {
      return null;
    }

    const decoded = componentValue.value.decoded;
    if (!decoded) {
      return null;
    }

    const pallet = decoded.type;
    const method = decoded.value.type;
    let args: Record<string, any> = {};

    if (pallet === 'Balances' && method === 'transfer_keep_alive') {
      const methodValue = decoded.value.value;
      args = {
        dest: methodValue.dest?.value || methodValue.dest,
        value: methodValue.value
      };
    } else if (pallet === 'System' && method === 'remark') {
      const methodValue = decoded.value.value;
      args = {
        remark: methodValue.remark
      };
    } else if (pallet === 'Utility' && method === 'batch_all') {
      const methodValue = decoded.value.value;
      args = {
        calls: methodValue.calls
      };
    } else {
      // Generic fallback
      args = decoded.value.value;
    }

    return { pallet, method, args };
  } catch (error) {
    console.error('Error extracting extrinsic data:', error);
    return null;
  }
};

const extrinsicProps$ = state(
  localRuntimeCtx$.pipe(
    map(({ dynamicBuilder, lookup }) => {
      const codecType =
        "call" in lookup.metadata.extrinsic
          ? lookup.metadata.extrinsic.call
          : // TODO v14 is this one?
            lookup.metadata.extrinsic.type
      return {
        metadata: lookup.metadata,
        codecType,
        codec: dynamicBuilder.buildDefinition(codecType),
      }
    }),
  ),
)

export interface ExtrinsicsProps {
  preConfigured?: {
    pallet: string;
    method: string;
    args: Record<string, any>;
  };
  onExtrinsicChange?: (extrinsicData: {
    pallet: string;
    method: string;
    args: Record<string, any>;
  }) => void;
}

export const Extrinsics = withSubscribe(
  ({ preConfigured, onExtrinsicChange }: ExtrinsicsProps = {}) => {
    const [viewMode, setViewMode] = useState<"edit" | "json">("edit")
    const extrinsicProps = useStateObservable(extrinsicProps$)

    const [componentValue, setComponentValue] = useState<CodecComponentValue>({
      type: CodecComponentType.Initial,
      value: "",
    })

    useEffect(() => {
      if (preConfigured && extrinsicProps) {
        console.log('Building pre-configured extrinsic:', preConfigured);
        try {
          const preBuiltValue = buildExtrinsicValue(preConfigured);
          console.log('Pre-built value:', preBuiltValue);
          if (preBuiltValue) {
            setComponentValue({
              type: CodecComponentType.Updated,
              value: preBuiltValue,
            });
          }
        } catch (error) {
          console.error('Error building pre-configured extrinsic:', error);
        }
      }
    }, [preConfigured, extrinsicProps]);

    useEffect(() => {
      if (onExtrinsicChange && componentValue.type === CodecComponentType.Updated) {
        const extrinsicData = extractExtrinsicData(componentValue);
        if (extrinsicData) {
          console.log('Notifying parent of extrinsic change:', extrinsicData);
          onExtrinsicChange(extrinsicData);
        }
      }
    }, [componentValue, onExtrinsicChange]);

    const binaryValue =
      (componentValue.type === CodecComponentType.Initial
        ? componentValue.value
        : componentValue.value.empty
          ? null
          : componentValue.value.encoded) ?? null

    return (
      <div
        className={twMerge(
          "flex flex-col overflow-hidden gap-2 p-4 pb-0",
          // Bypassing top-level scroll area, since we need a specific scroll area for the tree view
          // "absolute w-full max-w-(--breakpoint-xl)",
        )}
      >

        <BinaryDisplay
          {...extrinsicProps}
          value={componentValue}
          onUpdate={(value) =>
            {
              console.log('Updated value:', value),
              setComponentValue({ type: CodecComponentType.Updated, value })
            }
          }
        />

        <div className="flex flex-row justify-between px-2">
          <ButtonGroup
            value={viewMode}
            onValueChange={setViewMode as any}
            items={[
              {
                value: "edit",
                content: "Edit",
              },
              {
                value: "json",
                content: "JSON",
                disabled: !binaryValue,
              },
            ]}
          />
        </div>

        {viewMode === "edit" ? (
          <EditMode
            {...extrinsicProps}
            value={componentValue}
            onUpdate={(value) =>
              {
                console.log('Updated value:', value),
                setComponentValue({ type: CodecComponentType.Updated, value })
              }
            }
          />
        ) : (
          <JsonMode
            value={
              typeof binaryValue === "string"
                ? Binary.fromHex(binaryValue).asBytes()
                : binaryValue
            }
            decode={extrinsicProps.codec.dec}
          />
        )}
      </div>
    )
  },
  {
    fallback: <LoadingMetadata />,
  },
)
