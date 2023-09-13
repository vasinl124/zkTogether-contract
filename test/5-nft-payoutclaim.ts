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

const hashAccount = (
  prefix,
  account,
  typeId,
  f_amount,
) => {
  return Buffer.from(
    ethers.utils
      .solidityKeccak256(
        ["string", "address", "uint256", "uint256"],
        [prefix, account, typeId, f_amount],
      )
      .slice(2),
    "hex",
  );
};

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

  describe("Payout Claim", () => {
    it("Payout Claim should fail --> not enabled", async () => {
      await expect(nft.connect(addr2).claimPayout(typeId)).to.be.revertedWith(
        "PayoutNotActive",
      );
    });

    it("Payout Claim should pass", async () => {
      await nft.setSaleStatus(typeId, true);

      const saleConfig = await nft
        .connect(addr1)
        .getSaleConfig(typeId);

      const amount = 2;
      const cost = (costPerUnitPublic * amount).toFixed(3);

      const revenueShareAmount = (ethers.utils.parseEther(cost.toString()) * saleConfig.revenueSharePercentage) / 10000

      await expect(() =>
        nft.connect(addr1).mint(typeId, amount, addr2.address, {          
          value: ethers.utils.parseEther(cost.toString()),
        })
      ).to.changeEtherBalances(
        [addr1, addr3],
        [ethers.utils.parseEther((-cost).toString()), ethers.utils.parseEther(cost.toString()).sub(revenueShareAmount)],
      )

      const userMintInfo = await nft
        .connect(addr1)
        .userMintInfo(typeId, addr2.address);

      expect(userMintInfo.revenueShareAmount).to.equal((ethers.utils.parseEther(cost.toString()) * saleConfig.revenueSharePercentage) / 10000);

      await nft.togglePayoutStatus(true);

      await expect(() =>
      nft.connect(addr2).claimPayout(typeId)
      ).to.changeEtherBalances(
        [addr2],
        [(ethers.utils.parseEther(cost.toString()) * saleConfig.revenueSharePercentage) / 10000],
      )

      const userMintInfoAfter = await nft
        .connect(addr1)
        .userMintInfo(typeId, addr2.address);

        expect(userMintInfoAfter.revenueShareAmount).to.equal(0);
        expect(userMintInfoAfter.claimedRevenueShareAmount).to.equal((ethers.utils.parseEther(cost.toString()) * saleConfig.revenueSharePercentage) / 10000);
    });

    it("BonusMint should fail --> cannot claim no more", async () => {
      await nft.setSaleStatus(typeId, true);

      const saleConfig = await nft
        .connect(addr1)
        .getSaleConfig(typeId);

      const amount = 2;
      const cost = (costPerUnitPublic * amount).toFixed(3);

      const revenueShareAmount = (ethers.utils.parseEther(cost.toString()) * saleConfig.revenueSharePercentage) / 10000

      await expect(() =>
        nft.connect(addr1).mint(typeId, amount, addr2.address, {          
          value: ethers.utils.parseEther(cost.toString()),
        })
      ).to.changeEtherBalances(
        [addr1, addr3],
        [ethers.utils.parseEther((-cost).toString()), ethers.utils.parseEther(cost.toString()).sub(revenueShareAmount)],
      )

      const userMintInfo = await nft
        .connect(addr1)
        .userMintInfo(typeId, addr2.address);

      expect(userMintInfo.revenueShareAmount).to.equal((ethers.utils.parseEther(cost.toString()) * saleConfig.revenueSharePercentage) / 10000);

      await nft.togglePayoutStatus(true);

      await expect(() =>
      nft.connect(addr2).claimPayout(typeId)
      ).to.changeEtherBalances(
        [addr2],
        [(ethers.utils.parseEther(cost.toString()) * saleConfig.revenueSharePercentage) / 10000],
      )

      const userMintInfoAfter = await nft
      .connect(addr1)
      .userMintInfo(typeId, addr2.address);

      expect(userMintInfoAfter.revenueShareAmount).to.equal(0);
      expect(userMintInfoAfter.claimedRevenueShareAmount).to.equal((ethers.utils.parseEther(cost.toString()) * saleConfig.revenueSharePercentage) / 10000);


      await expect(() =>
      nft.connect(addr2).claimPayout(typeId)
      ).to.be.revertedWith("NoETHLeft");
    });
  });
});
