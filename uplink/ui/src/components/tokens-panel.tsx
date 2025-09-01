import { useCallback, useEffect, useRef, useState } from "react";
import FloatingPanel from "./floating-panel";
import { pb, TokenBundle } from "@/lib/pocketbase";
import { ClientResponseError } from "pocketbase";
import { toast } from "./toaster";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

interface TokensPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TokensPanel({ isOpen, onClose }: TokensPanelProps) {
    const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_ID || "");
    const [isLoading, setIsLoading] = useState(true);
    const [tokenBundles, setTokenBundles] = useState<TokenBundle[]>([]);
    const [selectedTokenBundle, setSelectedTokenBundle] = useState<TokenBundle | null>(null);

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    useEffect(() => {
        setIsLoading(true);
        pb.collection('token_bundles').getFullList().then((bundles) => {
            setTokenBundles(bundles);
            setIsLoading(false);
        }).catch((error: ClientResponseError) => {
            if (error.isAbort) { return }
            toast.error("Failed to fetch token bundles: " + error);
            console.error("Failed to fetch token bundles:", error);
            onCloseRef.current();
        })
    }, [])

    const fetchClientSecret = useCallback(() => {
        return pb.send("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: { stripe_price_id: selectedTokenBundle?.stripe_price_id, token_bundle_id: selectedTokenBundle?.id }
        }).then((data) => data.client_secret);
    }, [selectedTokenBundle]);

    return (
        <FloatingPanel
            isOpen={isOpen}
            onClose={() => { onClose(); setSelectedTokenBundle(null); }}
            isLoading={isLoading}
            loadingTitle="Token Bundles"
            loadingMessage="Fetching available token bundles..."
        >
            <div className="flex flex-col min-w-80">
                <h2 className="text-lg font-semibold mb-2">Token Bundles</h2>
                {selectedTokenBundle === null ? (!isLoading && tokenBundles.map((bundle) => (
                    <button key={bundle.id} onClick={() => setSelectedTokenBundle(bundle)} className="flex items-baseline hover:cursor-pointer hover:bg-neutral-800 rounded p-2 hover:text-yellow-200 hover:font-bold text-xl">
                        <span className="leading-[0.895] -tracking-[0.1em] hover:font-bold">{bundle.tokens.toLocaleString()}</span>
                        <span className="text-lg">tokens</span>
                        <div className="flex-1"></div>
                        <span>${(bundle.tokens / 100).toLocaleString()}</span>
                    </button>
                ))) : (
                    <div className="w-96 h-96 overflow-y-scroll">
                        <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
                            <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                    </div>
                )}
            </div>
        </FloatingPanel>
    )
}