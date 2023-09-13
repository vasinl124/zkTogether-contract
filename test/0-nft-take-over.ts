import { expect } from 'chai';
import { Wallet, Provider } from 'zksync-web3';
import * as hre from 'hardhat';

import { CONTRACTS } from "../utils/helper-hardhat-config";

const costPerUnitPublic = 0.007;
const discountedCostPerUnitPublic = 0.005;
const royalty = 500;
const typeId = 0;

const ownershipTransferPrice = 0.05;

const RICH_WALLET_PK =
  '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

const WALLET_1 =
'0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3'

const WALLET_2 =
'0xd293c684d884d56f8d6abd64fc76757d3664904e309a0645baf8522ab6366d9e'

const WALLET_3 =
'0x850683b40d4a740aa6e745f889a6fdc8327be76e122f5aba645a5b02d0248db8'

const WALLET_4 =
'0xf12e28c0eb1ef4ff90478f6805b68d63737b7f33abfa091601140805da450d93'

describe("NFT Contract", () => {
  let nft;
  let provider;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let devWalletAddress;

  beforeEach(async () => {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    provider = ethers.provider;

    devWalletAddress = addr3.address;

    const saleConfig = {
      maxPerTransaction: 5,
      unitPrice: ethers.utils.parseEther(costPerUnitPublic.toString()),
      discountedUnitPrice: ethers.utils.parseEther(discountedCostPerUnitPublic.toString()),
      revenueSharePercentage: 3000,
      exclusiveRevenueSharePercentage: 3500,
      signerAddress: addr3.address,
    };
  
    // const artifact = await deployer.loadArtifact(CONTRACTS.nft);
    const NFT = await ethers.getContractFactory(CONTRACTS.nft);
    nft = await NFT.deploy(
      "Cilantro", // name
      "CIL", // symbol
      "https://gateway.pinata.cloud/ipfs/Qmego24DURSSuijn1iVwbpiVFQG9WXKnUkiV4SErJmHJAd/", // baseURI
      888,
      royalty,
      devWalletAddress,
      saleConfig,
      ethers.utils.parseEther(ownershipTransferPrice.toString()),
    );
  });

  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      expect(await nft.owner()).to.equal(owner.address);
    });
  });

  describe("Take Over Ownership", () => {
    it("Toggle for sale on should fail -> not the owner", async () => {
      const cost = 0.04;
      expect(await nft.owner()).to.equal(owner.address);

      await expect(
        nft.connect(addr1).toggleContractForSale(true),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("TakeOver should ALL fail -> Not for sale", async () => {
      const cost = 0.04;
      expect(await nft.owner()).to.equal(owner.address);

      await expect(
        nft.connect(addr1).brotherIWantToTakeOver({
          value: ethers.utils.parseEther(cost.toString()),
        }),
      ).to.be.reverted;
    });

    it("TakeOver should ALL fail -> insufficient funds", async () => {
      const cost = 0.04;
      expect(await nft.owner()).to.equal(owner.address);

      await nft.toggleContractForSale(true);

      await expect(
        nft.connect(addr1).brotherIWantToTakeOver({
          value: ethers.utils.parseEther(cost.toString()),
        }),
      ).to.be.reverted;
    });

    it("TakeOver should ALL pass", async () => {
      const cost = 0.05;
      expect(await nft.owner()).to.equal(owner.address);

      await nft.toggleContractForSale(true);

      await expect(async () =>
      nft.connect(addr1).brotherIWantToTakeOver({
        value: ethers.utils.parseEther(cost.toString()),
        gasLimit: 500000,
      }),
      ).to.changeEtherBalances(
        [addr1, addr3],
        [ethers.utils.parseEther((-cost).toString()), ethers.utils.parseEther(cost.toString())],
      );


      expect(await nft.owner()).to.equal(addr1.address);
      expect(await nft.isForSale()).to.equal(false);
    });

    it("setTakeOverPrice should fail - not owner", async () => {
      const cost = 0.05;
      expect(await nft.owner()).to.equal(owner.address);
      const balanceBefore = await provider.getBalance(owner.address);

      await nft.toggleContractForSale(true);

      await expect(
        nft
          .connect(addr1)
          .setTakeOverPrice(ethers.utils.parseEther("0.1")),
      ).to.be.reverted;
    });

    it("setTakeOverPrice should pass and update the price", async () => {
      const cost = 0.05;
      expect(await nft.owner()).to.equal(owner.address);

      await nft.toggleContractForSale(true);

      await (await nft.setTakeOverPrice(ethers.utils.parseEther("0.1"))).wait();

      await expect(
        nft.connect(addr1).brotherIWantToTakeOver({
          value: ethers.utils.parseEther(cost.toString()),
        }),
      ).to.be.reverted;

      nft.connect(addr1).brotherIWantToTakeOver({
        value: ethers.utils.parseEther("0.1"),
      });
    });
  });
});
