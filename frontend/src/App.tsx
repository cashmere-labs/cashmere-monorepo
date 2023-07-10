import { PATHS } from './constants/paths';
import { DAO, ManagePage, Pool, Swap } from './pages';
import { NotFound } from './pages/NotFound/NotFound';
import { useEffect } from 'react';
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { observer } from 'mobx-react-lite';
import { useInjection } from 'inversify-react';
import ThemeStore from './store/ThemeStore';
import { useAccount, useDisconnect } from 'wagmi';
import { watchAccount } from '@wagmi/core';
import PendingTxHook from './store/components/PendingTxHook';

export default App;
