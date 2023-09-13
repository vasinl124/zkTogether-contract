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

  describe("ExclusiveMint", () => {
    it("ExclusiveMint should fail --> not enabled", async () => {
      const amount = 2;
      const f_amount = 1;
      const exclusiveMintSignature = await addr3.signMessage(
        hashAccount("0x168", addr1.address, typeId, f_amount),
      );

      await expect(
        nft
      .connect(addr1)
      .exclusiveMint(typeId, amount, f_amount, exclusiveMintSignature)
      ).to.be.revertedWith('SaleNotEnabled');
    });

    it("ExclusiveMint with referral should pass", async () => {
      await nft.setSaleStatus(typeId, true);

      const amount = 2;
      const f_amount = 1;
      const exclusiveMintSignature = await addr3.signMessage(
        hashAccount("0x168", addr1.address, typeId, f_amount),
      );

      const cost = (discountedCostPerUnitPublic * (amount - f_amount)).toFixed(4);

      await (await nft
        .connect(addr1)
        .exclusiveMint(typeId, amount, f_amount, exclusiveMintSignature, {
          value: ethers.utils.parseEther(cost.toString()),
        })).wait();

      const addr1Balance = await nft
        .connect(addr1)
        .balanceOf(addr1.address, typeId);
      expect(addr1Balance).to.equal(2);
    });

    it("ExclusiveMint should fail -> InvalidSignature", async () => {
      await nft.setSaleStatus(typeId, true);

      const amount = 2;
      const f_amount = 1;
      const exclusiveMintSignature = await addr3.signMessage(
        hashAccount("0x168", addr1.address, typeId, amount),
      );

      const cost = (discountedCostPerUnitPublic * (amount - f_amount)).toFixed(4);

      await expect(
        nft
          .connect(addr1)
          .exclusiveMint(typeId, amount, f_amount, exclusiveMintSignature, {
            value: ethers.utils.parseEther(cost.toString()),
          }),
      ).to.be.revertedWith("InvalidSignature");
    });

    it("ExclusiveMint should fail -> cannot pass amount smaller than f_amount", async () => {
      await nft.setSaleStatus(typeId, true);

      const amount = 2;
      const f_amount = 4;
      const exclusiveMintSignature = await addr3.signMessage(
        hashAccount("0x168", addr1.address, typeId, f_amount),
      );

      await expect(
        nft
          .connect(addr1)
          .exclusiveMint(typeId, amount, f_amount, exclusiveMintSignature),
      ).to.be.revertedWith("Invalid amount");
    });

    it("FreeMint should fail -> try to claim twice", async () => {
      await nft.setSaleStatus(typeId, true);

      const amount = 4;
      const f_amount = 2;
      const exclusiveMintSignature = await addr3.signMessage(
        hashAccount("0x168", addr1.address, typeId, f_amount),
      );

      const cost = (discountedCostPerUnitPublic * (amount - f_amount)).toFixed(4);

      await (await nft
        .connect(addr1)
        .exclusiveMint(typeId, amount, f_amount, exclusiveMintSignature, {
          value: ethers.utils.parseEther(cost.toString()),
        })).wait();


      const addr1Balance = await nft
        .connect(addr1)
        .balanceOf(addr1.address, typeId);
      expect(addr1Balance).to.equal(4);

      await expect(nft
        .connect(addr1)
        .exclusiveMint(typeId, amount, f_amount, exclusiveMintSignature, {
          value: ethers.utils.parseEther(cost.toString()),
        })).to.be.revertedWith("InsufficientFunds");

      const cost2 = (discountedCostPerUnitPublic * (amount)).toFixed(4);
        
      await nft
        .connect(addr1)
        .exclusiveMint(typeId, amount, f_amount, exclusiveMintSignature, {
          value: ethers.utils.parseEther(cost2.toString()),
        });
    });

    it("FreeMint should pass -> claim first and then buy lower than the f_amount should pass on second tx", async () => {
      await nft.setSaleStatus(typeId, true);

      const amount = 4;
      const f_amount = 2;
      const exclusiveMintSignature = await addr3.signMessage(
        hashAccount("0x168", addr1.address, typeId, f_amount),
      );

      const cost = (discountedCostPerUnitPublic * (amount - f_amount)).toFixed(4);

      await (await nft
        .connect(addr1)
        .exclusiveMint(typeId, amount, f_amount, exclusiveMintSignature, {
          value: ethers.utils.parseEther(cost.toString()),
        })).wait();


      const addr1Balance = await nft
        .connect(addr1)
        .balanceOf(addr1.address, typeId);
      expect(addr1Balance).to.equal(4);

      const amount2 = 1;
      const cost2 = (discountedCostPerUnitPublic * (amount2)).toFixed(4);

      await nft
        .connect(addr1)
        .exclusiveMint(typeId, amount2, f_amount, exclusiveMintSignature, {
          value: ethers.utils.parseEther(cost2.toString()),
        });
    });
  });
});
