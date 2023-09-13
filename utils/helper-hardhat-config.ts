import { ethers } from 'ethers';

const publicSaleMaxPerTransaction = 100;

const mainnetPublicSaleUnitPrice = 0.005;
const testnetPublicSaleUnitPrice = 0.005;

const mainnetPublicSaleUnitPriceDiscounted = 0.004;
const testnetPublicSaleUnitPriceDiscounted = 0.004;

const mainCollectionMainnetPublicSaleUnitPrice = 0.1;
const mainCollectionTestnetPublicSaleUnitPrice = 0.01;

const mainnetOwnershipTransferPrice = 25;
const testnetOwnershipTransferPrice = 0.05;

const mainCollectionMainnetOwnershipTransferPrice = 25;
const mainCollectionTestnetOwnershipTransferPrice = 0.05;

const revenueSharePercentage = 2500;
const exclusiveRevenueSharePercentage = 3500;

export const contratsToDeploy = {
  pass: {
    deploy: false,
    verify: false,
  },
  testpass: {
    deploy: false,
    verify: false,
  },
  main: {
    deploy: false,
    verify: false,
  },
  disperse: {
    deploy: true,
    verify: true,
  },
};

export const networkConfig = {
  default: {
    name: "hardhat",
  },
  324: {
    name: "main",
    wethAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    devMultisigAddress: "0x7303Bd4da70A2Dbd6D5E99E1Ea86ca6B21e5BC4E",
    pass: {
      contractName: "zkTogether",
      contractSymbol: "ZKT",
      initBaseURI: "https://z.whaletogether.com/tokens/",
      devReserve: 888,
      royalty: 500,
      saleConfig: {
        maxPerTransaction: publicSaleMaxPerTransaction,
        unitPrice: ethers.utils.parseEther(
          mainnetPublicSaleUnitPrice.toString(),
        ),
        discountedUnitPrice: ethers.utils.parseEther(
          mainnetPublicSaleUnitPriceDiscounted.toString(),
        ),
        revenueSharePercentage,
        exclusiveRevenueSharePercentage,
        signerAddress: "0xBf17BCb397010d16bE98B0c21F4e0183F1b61cac",
      },
      takeOverPrice: ethers.utils.parseEther(
        mainnetOwnershipTransferPrice.toString(),
      ),
    },
    main: {
      // contractName: "WordThatGrows",
      // contractSymbol: "WORD",
      // royalty: 500,
      // mintPlanConfig: {
      //   enabled: false,
      //   maxSupply: 1000,
      //   devReserve: 69,
      //   maxPerTransaction: 1,
      //   maxPerWallet: 10,
      //   unitPrice: ethers.utils.parseEther(
      //     mainCollectionMainnetPublicSaleUnitPrice.toString(),
      //   ),
      //   passContract: "0x0000000000000000000000000000000000000000",
      // },
      // ownershipTransferPrice: ethers.utils.parseEther(
      //   mainCollectionMainnetOwnershipTransferPrice.toString(),
      // ),
    },
  },
  280: {
    name: "goerli",
    wethAddress: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
    devMultisigAddress: "0xEfe6045b2df13b4D5d59e09e9f1B73afFded81BE",
    pass: {
      contractName: "_PASS_PASS",
      contractSymbol: "PASS",
      initBaseURI: "https://dev-api.pass.gg/tokens/",
      devReserve: 888,
      royalty: 500,
      saleConfig: {
        maxPerTransaction: publicSaleMaxPerTransaction,
        unitPrice: ethers.utils.parseEther(
          testnetPublicSaleUnitPrice.toString(),
        ),
        discountedUnitPrice: ethers.utils.parseEther(
          testnetPublicSaleUnitPriceDiscounted.toString(),
        ),
        revenueSharePercentage,
        exclusiveRevenueSharePercentage,
        signerAddress: "0xBf17BCb397010d16bE98B0c21F4e0183F1b61cac",
      },
      takeOverPrice: ethers.utils.parseEther(
        testnetOwnershipTransferPrice.toString(),
      ),
    },
    main: {
      // contractName: "_MAINNNNNN___",
      // contractSymbol: "MAIN",
      // royalty: 500,
      // mintPlanConfig: {
      //   enabled: false,
      //   maxSupply: 1000,
      //   devReserve: 69,
      //   maxPerTransaction: 1,
      //   maxPerWallet: 10,
      //   unitPrice: ethers.utils.parseEther(
      //     mainCollectionTestnetPublicSaleUnitPrice.toString(),
      //   ),
      //   passContract: "0x0000000000000000000000000000000000000000",
      // },
      // ownershipTransferPrice: ethers.utils.parseEther(
      //   mainCollectionTestnetOwnershipTransferPrice.toString(),
      // ),
    },
  },
};

export const CONTRACTS = {
  nft: "zkTogether",
  testnft: "TestPass",
  mainNft: "Main",  
  disperse: "Disperse",  
};

export const developmentChains = ["hardhat", "localhost"];

export const getNetworkIdFromName = async (networkIdName) => {
  for (const id in networkConfig) {
    if (networkConfig[id]["name"] == networkIdName) {
      return id;
    }
  }
  return null;
};

// module.exports = {
//   contratsToDeploy,
//   networkConfig,
//   getNetworkIdFromName,
//   developmentChains,
//   CONTRACTS,
// };
