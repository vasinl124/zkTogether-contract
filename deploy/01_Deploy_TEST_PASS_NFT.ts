
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

  if (contratsToDeploy.testpass.deploy) {
    log(
      "======================================================================",
    );
    log(
      `====================== NFT: ${contractName} [${CONTRACTS.testnft}] ==========================`,
    );
    log(
      "======================================================================",
    );

    const nft = await deploy(CONTRACTS.testnft, {
      from: deployer,
      log: true,
      args: [
        'TESTPASS',
        'TEST',
        'https://dev-api.pass.gg/tokens/',
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

    if (contratsToDeploy.testpass.verify) {
      await hre.run("verify:verify", {
        address: nft.address,
        constructorArguments: [
          'TESTPASS',
          'TEST',
          'https://dev-api.pass.gg/tokens/',
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
      console.log(`[Contract] ${CONTRACTS.testnft} has been verify!`);
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
