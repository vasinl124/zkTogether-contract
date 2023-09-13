
import { CONTRACTS, networkConfig, contratsToDeploy } from '../utils/helper-hardhat-config';

export default async function (hre) {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  const { pass, devMultisigAddress } = networkConfig[chainId];
  const {
    contractName,
    contractSymbol,
    initBaseURI,
    devReserve,
    royalty,
    saleConfig,
    takeOverPrice,
  } = pass;

  if (contratsToDeploy.pass.deploy) {
    log(
      "======================================================================",
    );
    log(
      `====================== NFT: ${contractName} [${CONTRACTS.nft}] ==========================`,
    );
    log(
      "======================================================================",
    );

    const nft = await deploy(CONTRACTS.nft, {
      from: deployer,
      log: true,
      args: [
        contractName,
        contractSymbol,
        initBaseURI,
        devReserve,
        royalty,
        devMultisigAddress,
        saleConfig,
        takeOverPrice,
      ],
    });

    log("=====================================================");
    log(`You have deployed an NFT contract to "${nft.address}"`);
    log("=====================================================");

    if (contratsToDeploy.pass.verify) {
      await hre.run("verify:verify", {
        address: nft.address,
        constructorArguments: [
          contractName,
          contractSymbol,
          initBaseURI,
          devReserve,
          royalty,
          devMultisigAddress,
          saleConfig,
          takeOverPrice,
        ],
      });

      console.log("***********************************");
      console.log("***********************************");
      console.log("\n");
      console.log(`[Contract] ${CONTRACTS.nft} has been verify!`);
      console.log(`https://goerli.explorer.zksync.io/address/${nft.address}#contract`);
      console.log("\n");
      console.log("***********************************");
      console.log("***********************************");
    }
  } else {
    log(
      "======================================================================",
    );
    log(
      `====================== [SKIPPED]: ${contractName} [${CONTRACTS.nft}] ==========================`,
    );
    log(
      "======================================================================",
    );
  }
};
