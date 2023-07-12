'use client';

import {
  ChoosePool,
  DepositDashboard,
  Footer,
  Navbar,
  Pools,
} from "../../components";
import { useTitle } from "../../hooks/useTitle";
import { useState } from "react";
import { Token } from "../../types/token";
import { Layout } from "../../ui";

import styles from "./Pool.module.scss";
import { activeChains, Chain } from '../../constants/chains';
import useAsyncEffect from 'use-async-effect';
import { pools } from '../../store/PoolStore';
import { getAccount, readContract } from "@wagmi/core";
import AssetABI from '../../abi/Asset.json';
import Big from 'big.js';
import toBig from "../../utils/toBig";

export type FilterType = {
  network: null | Chain;
  token: null | Token;
};

export enum PoolTab {
  "ALL",
  "MY",
}

const Pool = () => {
  useTitle("Pools");

  const [filter, setFilter] = useState<FilterType>({
    network: null,
    token: null,
  });

  const [poolTab, setPoolTab] = useState<PoolTab>(PoolTab.ALL);

  const [ deposits, setDeposits ] = useState<Big[]>(new Array(pools.length).fill(new Big(0)));

  useAsyncEffect(async () => {
    const array = deposits.concat();
    await Promise.all(pools.map(async (pool, i) => {
      const balance = await readContract({
        abi: AssetABI,
        address: pool.assetAddress,
        chainId: pool.network,
        functionName: 'balanceOf',
        args: [getAccount().address],
      });
      array[i] = toBig(balance).div('1e18');
      setDeposits(array.concat());
    }));
  }, []);

  return (
    <>
      <Layout>
        <Navbar />
        <div className={styles.wrapper}>
          <DepositDashboard myDepositsSum={deposits.reduce((acc, i) => acc.add(i), new Big(0))} />
          <ChoosePool
            poolTab={poolTab}
            setPoolTab={setPoolTab}
            filter={filter}
            setFilter={setFilter}
            tokenOptions={[] /*tokenOptions*/}
            networkOptions={activeChains}
          />
          <Pools filter={filter} poolTab={poolTab} deposits={deposits} />
        </div>
        <Footer />
      </Layout>
    </>
  );
};

export default Pool;
