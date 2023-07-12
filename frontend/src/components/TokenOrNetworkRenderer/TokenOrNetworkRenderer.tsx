import { Row } from "../../components";
import { Token } from "../../types/token";
import { NetworkBadge } from "../../ui";
import { Chain } from '../../constants/chains';
import Image from "next/image";

const TokenOrNetworkRenderer = ({
  tokenOrNetwork,
  imgSize = 24,
  type = "default",
}: {
  tokenOrNetwork: Token | Chain;
  imgSize?: number;
  type?: "badge" | "default";
}) => {
  return (
    <Row style={{ width: "max-content" }} alignItems="center">
      {tokenOrNetwork instanceof Token || type === "default" ? (
        <>
          <Image
            style={{ marginRight: "8px" }}
            width={imgSize}
            src={tokenOrNetwork.iconUrl}
            height={imgSize}
            alt={tokenOrNetwork.name}
          />
          <span style={{ color: "var(--text)" }}>{tokenOrNetwork.name}</span>
        </>
      ) : (
        <NetworkBadge
          size={24}
          fontSize="14px"
          chain={tokenOrNetwork}
        />
      )}
    </Row>
  );
};

export { TokenOrNetworkRenderer };