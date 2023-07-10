export default {
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/i,
            resourceQuery: { not: /component/ },
            type: 'asset',
        });
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            resourceQuery: /component/,
            use: ['@svgr/webpack'],
        });

        return config;
    },
    images: {
        domains: ['assets-cdn.trustwallet.com'],
    }
}
