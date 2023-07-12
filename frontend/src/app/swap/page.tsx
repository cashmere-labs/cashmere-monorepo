'use client';

import { Footer, Navbar, SwapBox } from '../../components';
import { GasEstimatorModal } from '../../components';
import { getMockEstimations } from '../../constants/mockEstimateData';
import { useTitle } from '../../hooks/useTitle';
import { Token } from '../../types/token';
import { Layout } from '../../ui';

import styles from './Swap.module.scss';
import { Chain } from '../../constants/chains';
import { useModal } from "../../hooks";

export type SwapState = {
    fromChain: Chain;
    fromToken: Token;
    toChain: Chain;
    toToken: Token;
    fromAmount: string;
};

const Page = () => {
    useTitle('Swap');

    const estimateModal = useModal();

    return (
        <Layout>
            <Navbar/>
            <div className={styles.wrapper}>
                <SwapBox />
            </div>
            <div onClick={estimateModal.open} className={styles.estimator}>
                <span>Estimate transfer gas fees</span>
            </div>
            <GasEstimatorModal
                modalController={estimateModal}
                estimates={getMockEstimations()}
            />
            <Footer/>
        </Layout>
    );
};

export default Page;
