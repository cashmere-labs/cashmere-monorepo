import { Mutex } from 'async-mutex';
import { getAssetRouterRepository } from '@cashmere-monorepo/blockchain';
import { logger } from '@cashmere-monorepo/serverless-configuration';

export const main: () => Promise<{
  body: {
    mumbai: {
      maxTime: number;
      medianTime: number;
      averageTime: number;
      minTime: number;
    };
    goerli: {
      maxTime: number;
      medianTime: number;
      averageTime: number;
      minTime: number;
    };
  };
  statusCode: number;
}> = async () => {
  let maxMumbaiTime = 0;
  let minMumbaiTime = 0;
  const mumbaiTimes: number[] = [];

  let maxGoerliTime = 0;
  let minGoerliTime = 0;
  const goerliTimes: number[] = [];

  // Get the repository on which we will perform the test
  const mumbaiRepository = getAssetRouterRepository(80001);
  const goerliRepository = getAssetRouterRepository(5);
  //const goerliRepository = getAssetRouterRepository(84531);

  // Build the param we will use to test
  const mumbaiTestParam = {
    lwsAssetId: 1,
    hgsAssetId: 1,
    dstChainId: 10121,
    amount: 3000000n,
    minAmount: 1000000n,
  };
  const goerliTestParam = {
    lwsAssetId: 1,
    hgsAssetId: 1,
    dstChainId: 10109,
    amount: 3000000n,
    minAmount: 1000000n,
  };

  const mutex = new Mutex();

  // Create an iteration of 20 call's
  for (let i = 0; i < 20; i++) {
    await mutex.runExclusive(async () => {
      let initialTime = new Date().getTime();
      // Perform mumbai test
      await mumbaiRepository.quoteSwaps(mumbaiTestParam);
      const mumbaiTime = new Date().getTime() - initialTime;

      // Reset the initial time
      initialTime = new Date().getTime();
      // Perform the goerli test
      await goerliRepository.quoteSwaps(goerliTestParam);
      const goerliTime = new Date().getTime() - initialTime;

      // Update the times for mumbai
      if (mumbaiTime > maxMumbaiTime) {
        maxMumbaiTime = mumbaiTime;
      }
      if (mumbaiTime < minMumbaiTime || minMumbaiTime === 0) {
        minMumbaiTime = mumbaiTime;
      }
      mumbaiTimes.push(mumbaiTime);

      // Update the times for goerli
      if (goerliTime > maxGoerliTime) {
        maxGoerliTime = goerliTime;
      }
      if (goerliTime < minGoerliTime || minGoerliTime === 0) {
        minGoerliTime = goerliTime;
      }
      goerliTimes.push(goerliTime);

      // `Wait for 100ms
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  }

  // Compute the average time for mumbai
  const mumbaiAverageTime =
    mumbaiTimes.reduce((a, b) => a + b) / mumbaiTimes.length;
  // Compute the median time for mumbai
  const mumbaiMedianTime = mumbaiTimes.sort((a, b) => a - b)[
    Math.floor(mumbaiTimes.length / 2)
  ]!;

  // Compute the average time for goerli
  const goerliAverageTime =
    goerliTimes.reduce((a, b) => a + b) / goerliTimes.length;
  // Compute te media time for goerli
  const goerliMedianTime = goerliTimes.sort((a, b) => a - b)[
    Math.floor(goerliTimes.length / 2)
  ]!;

  // Log the results with template strings
  logger.warn(`Mumbai average time: ${mumbaiAverageTime}ms`);
  logger.warn(`Mumbai median time: ${mumbaiMedianTime}ms`);
  logger.warn(`Mumbai max time: ${maxMumbaiTime}ms`);
  logger.warn(`Mumbai min time: ${minMumbaiTime}ms`);
  logger.warn(`Goerli average time: ${goerliAverageTime}ms`);
  logger.warn(`Goerli median time: ${goerliMedianTime}ms`);
  logger.warn(`Goerli max time: ${maxGoerliTime}ms`);
  logger.warn(`Goerli min time: ${minGoerliTime}ms`);

  // Return, with in the body the results for goerli and mumbai
  return {
    statusCode: 200,
    body: {
      mumbai: {
        averageTime: mumbaiAverageTime,
        medianTime: mumbaiMedianTime,
        maxTime: maxMumbaiTime,
        minTime: minMumbaiTime,
      },
      goerli: {
        averageTime: goerliAverageTime,
        medianTime: goerliMedianTime,
        maxTime: maxGoerliTime,
        minTime: minGoerliTime,
      },
    },
  };
};
