import React, { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { observer } from 'mobx-react-lite';
import {
    connectorsForWallets,
    createAuthenticationAdapter,
    darkTheme,
    lightTheme,
    RainbowKitAuthenticationProvider,
    RainbowKitProvider, WalletList,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { publicProvider } from 'wagmi/providers/public';
import { useInjection } from 'inversify-react';
import ThemeStore from './store/ThemeStore';
import { activeChains } from './constants/chains';
import { AuthStore } from './store/AuthStore';
import { Api } from './utils/api';
import { Chain } from '@wagmi/core';
import {
    argentWallet,
    braveWallet,
    coinbaseWallet,
    injectedWallet, ledgerWallet,
    metaMaskWallet, rabbyWallet,
    rainbowWallet,
    safeWallet, trustWallet, walletConnectWallet
} from '@rainbow-me/rainbowkit/wallets';
import '@rainbow-me/rainbowkit/styles.css';

const getWallets = ({ appName, chains, projectId }: {
    appName: string;
    projectId: string;
    chains: Chain[];
}): {
    connectors: ReturnType<typeof connectorsForWallets>;
    wallets: WalletList;
} => {
    const wallets: WalletList = [
        {
            groupName: 'Popular',
            wallets: [
                injectedWallet({ chains }),
                safeWallet({ chains }),
                rainbowWallet({ chains, projectId }),
                coinbaseWallet({ appName, chains }),
                metaMaskWallet({ chains, projectId }),
                walletConnectWallet({ chains, projectId }),
                braveWallet({ chains }),
            ],
        },
        {
            groupName: 'More',
            wallets: [
                trustWallet({ chains, projectId }),
                ledgerWallet({ chains, projectId }),
                rabbyWallet({ chains }),
                argentWallet({ chains, projectId }),
            ],
        },
    ];

    return {
        connectors: connectorsForWallets(wallets),
        wallets,
    };
};

const { chains, publicClient, webSocketPublicClient } = configureChains(
    activeChains,
    [
        publicProvider()
    ]
);

const { connectors } = getWallets({
    appName: 'Cashmere Swap',
    projectId: '52a500abb8f616cf072faf7f2d57a718',
    chains,
});

const config = createConfig({
    autoConnect: true,
    connectors,
    publicClient,
    webSocketPublicClient,
});

const RainbowKit = observer(({ children }: PropsWithChildren) => {
    const themeStore = useInjection(ThemeStore);
    const authStore = useInjection(AuthStore);
    const api = useInjection(Api);

    const [ mounted, setMounted ] = useState(false);

    useEffect(() => setMounted(true));

    const authenticationAdapter = useMemo(() => (
        createAuthenticationAdapter({
            createMessage: ({ nonce, address }) => {
                try {
                    return authStore.createMessage(nonce, address);
                } catch (e) {
                    console.error(e);
                    throw e;
                }
            },
            getMessageBody: ({ message }) => {
                return authStore.prepareMessage(message);
            },
            getNonce: async () => {
                return (await api.getNonce(authStore.updateNonceRequestId())).nonce;
            },
            signOut: async () => {
                return authStore.logout();
            },
            verify: async ({ message, signature }) => {
                return authStore.login(message, signature);
            },
        })
    ), [authStore, api]);

    return (
        <WagmiConfig config={config}>
            <RainbowKitProvider
                theme={themeStore.theme === 'dark' ? darkTheme() : lightTheme()}
                chains={chains}
            >
                <RainbowKitAuthenticationProvider
                    adapter={authenticationAdapter}
                    status={authStore.status}
                >
                    {mounted && children}
                </RainbowKitAuthenticationProvider>
            </RainbowKitProvider>
        </WagmiConfig>
    );
});

export default RainbowKit;