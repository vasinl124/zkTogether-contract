
import { CONTRACTS, networkConfig, contratsToDeploy } from '../utils/helper-hardhat-config';

export default async function (hre) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  if (contratsToDeploy.disperse.deploy) {
    log(
      "======================================================================",
    );
    log(
      `====================== Contract: [${CONTRACTS.disperse}] ==========================`,
    );
    log(
      "======================================================================",
    );

    const contract = await deploy(CONTRACTS.disperse, {
      from: deployer,
      log: true,
    });

    log("=====================================================");
    log(`You have deployed a contract to "${contract.address}"`);
    log("=====================================================");

    if (contratsToDeploy.disperse.verify) {
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: [],
      });

      console.log("***********************************");
      console.log("***********************************");
      console.log("\n");
      console.log(`[Contract] ${CONTRACTS.disperse} has been verify!`);
      console.log(`https://goerli.explorer.zksync.io/address/${contract.address}#contract`);
      console.log("\n");
      console.log("***********************************");
      console.log("***********************************");
    }
  } else {
    log(
      "======================================================================",
    );
    log(
      `====================== [SKIPPED]: [${CONTRACTS.disperse}] ==========================`,
    );
    log(
      "======================================================================",
    );
  }
};
