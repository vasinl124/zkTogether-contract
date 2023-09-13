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

  describe("Mint Public", () => {
    it("PublicMint should fail -> NOT Invalid typeId", async () => {
      
      const amount = 1;
      const cost = (costPerUnitPublic * amount).toFixed(3);

      await expect(
        nft.connect(addr1).mint(12, amount, ethers.constants.AddressZero, {
          value: ethers.utils.parseEther(cost.toString()),
        })
      ).to.be.revertedWith('InvalidTokenId');
    });

    it("PublicMint should fail -> NOT Active", async () => {
        const amount = 1;
        const cost = (costPerUnitPublic * amount).toFixed(3);

        await expect(
          nft.connect(addr1).mint(typeId, amount, ethers.constants.AddressZero, {          
            value: ethers.utils.parseEther(cost.toString()),
          })
        ).to.be.revertedWith('SaleNotEnabled');
    });

    it("PublicMint should fail -> More than MAX_PER_PURCHASE", async () => {
      await nft.setSaleStatus(typeId, true);
        const amount = 6; // Max per purchase is 5
        const cost = (costPerUnitPublic * amount).toFixed(4);
  
        await expect(
          nft.connect(addr1).mint(typeId, amount, ethers.constants.AddressZero, {
            value: ethers.utils.parseEther(cost.toString()),
          })
        ).to.be.revertedWith('ExceedsMaxPerTransaction');
    });


    it("PublicMint should fail -> Cannot refer yourself", async () => {
      await nft.setSaleStatus(typeId, true);
        const amount = 5; // Max per purchase is 5
        const cost = (costPerUnitPublic * amount).toFixed(4);
  
        await expect(
          nft.connect(addr1).mint(typeId, amount, addr1.address, {
            value: ethers.utils.parseEther(cost.toString()),
          })
        ).to.be.revertedWith('InvalidReferral');
    });

    it("PublicMint should ALL PASS", async () => {
      await nft.setSaleStatus(typeId, true);
      const amount = 5;
      const cost = (costPerUnitPublic * amount).toFixed(4);

        await expect(() =>
        nft.connect(addr1).mint(typeId, amount, ethers.constants.AddressZero, {          
          value: ethers.utils.parseEther(cost.toString()),
        })
      ).to.changeEtherBalances(
        [addr1, addr3],
        [ethers.utils.parseEther((-cost).toString()), ethers.utils.parseEther(cost.toString())],
      )


      const balanceOwned = await nft
        .connect(addr1)
        .balanceOf(addr1.address, typeId);
      expect(balanceOwned).to.equal(amount);
    });
  });

  describe("DevMint Reserve NFTs", () => {
    it("DevMint Reserve NFTs", async () => {
      const amount = 50;

      const DEV_RESERVE_BEFORE = (await nft.mintPlan(typeId)).devReserve;
      expect(DEV_RESERVE_BEFORE).to.be.equal(888);
      await (await nft.connect(owner).devMintTo(devWalletAddress, [typeId], [amount])).wait();
      await (await nft.connect(owner).devMintTo(devWalletAddress, [typeId], [amount])).wait();
      await (await nft.connect(owner).devMintTo(devWalletAddress, [typeId], [amount])).wait();
      await (await nft.connect(owner).devMintTo(devWalletAddress, [typeId], [amount])).wait();

      const DEV_RESERVE_AFTER = (await nft.mintPlan(typeId)).devReserve;
      expect(DEV_RESERVE_AFTER).to.be.equal(688);

      const totalSupplyCount = await nft.totalSupply(typeId);
      const totalBalance = await nft.balanceOf(devWalletAddress, typeId);
      expect(totalSupplyCount).to.equal(200);
      expect(totalBalance).to.equal(200);
    });
    it("DevMint should fail not owner", async () => {
      try {
        const amount = 50;
        await nft.connect(addr1).devMintTo(owner.address, [typeId], [amount]);
      } catch (error) {
        expect(error.message).to.contain("Ownable: caller is not the owner");
      }
    });
  });
});
