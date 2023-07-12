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

        // fix hosted font loading
        // https://github.com/webpack-contrib/mini-css-extract-plugin/issues/945#issuecomment-1253939973
        config.module.generator.asset.publicPath = "/_next/";

        return config;
    },
    images: {
        domains: ['assets-cdn.trustwallet.com'],
    }
}
