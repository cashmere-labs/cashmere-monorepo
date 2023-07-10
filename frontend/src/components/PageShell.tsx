'use client';

import { Provider as InversifyProvider, useInjection } from "inversify-react";
import { rootStore } from "../store/RootStore";
import RainbowKit from '../RainbowKit';
import React, { useEffect } from "react";
import ThemeStore from "../store/ThemeStore";
import { useAccount, useDisconnect } from "wagmi";
import { watchAccount } from "@wagmi/core";
import { ToastContainer } from "react-toastify";
import PendingTxHook from "../store/components/PendingTxHook";
import { observer } from "mobx-react-lite";
import '../styles/index.scss';


const container = rootStore.container;

export const PageShell = ({ children }: React.PropsWithChildren) => (
    <React.StrictMode>
        <InversifyProvider container={container}>
            <RainbowKit>
                <App>
                    {children}
                </App>
            </RainbowKit>
        </InversifyProvider>
    </React.StrictMode>
);

// const NavigationAnimator = () => {
//     const { pathname } = useLocation();
//
//     useEffect(() => {
//         document.body.animate([{ opacity: 0.8 }, { opacity: 1 }], {
//             duration: 200,
//             fill: 'forwards',
//         });
//         window.scrollTo({ top: 0 });
//     }, [pathname]);
//
//     return null;
// };



const App = observer(({ children }: React.PropsWithChildren) => {
    const themeStore = useInjection(ThemeStore);
    const { disconnect } = useDisconnect();
    const { address } = useAccount();

    useEffect(() => {
        const unwatch = watchAccount((newAccount) => {
            if (address && address !== newAccount.address)
                disconnect();
        });
        return unwatch;
    }, [address, disconnect]);

    return (
        <>
            {children}
            <ToastContainer pauseOnHover={false} theme={themeStore.theme}/>
            <PendingTxHook/>
        </>
    );
});
