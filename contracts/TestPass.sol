// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error SaleNotEnabled();
error NotAuthorizedWallet();
error InsufficientFunds();
error InvalidTokenId();
error NoETHLeft();
error ExceedsMaxPerTransaction();
error ETHTransferFailed();
error InvalidSignature();
error InvalidInput();
error ExceedsDevReserve();
error NotForSale();
error PayoutNotActive();
error InvalidReferral();

contract TestPass is Ownable, ERC1155Supply, ERC2981 {
    using ECDSA for bytes32;
    using Strings for uint256;

    event SaleStatusChange(uint256 indexed typeId, bool enabled);
    event Minted(address recipient, uint256 typeId, uint256 amount);

    struct SaleConfig {
        bool enabled;
        uint8 maxPerTransaction;
        uint64 unitPrice;
        uint64 discountedUnitPrice;
        uint256 revenueSharePercentage;
        uint256 exclusiveRevenueSharePercentage;
        address signerAddress;
    }

    struct MintPlan {
        uint256 devReserve;
        string baseURI;
        bool isAvailable;
    }

    struct UserMintInfo {
        uint256 revenueShareAmount;
        uint256 claimedRevenueShareAmount;
        uint256 freeClaimedAmount;
        bool isExclusive;
    }

    address private _devMultiSigWalletAddress;

    uint256 public takeOverPrice;

    string public name;
    string public symbol;

    bool public isForSale;
    bool public isPayoutActive;

    mapping(uint256 => SaleConfig) public _saleConfig; // typeId => SaleConfig
    mapping(uint256 => MintPlan) public mintPlan; // typeId => MintPlan
    mapping(uint256 => mapping(address => UserMintInfo)) public userMintInfo;
    mapping(string => address) public referralAddresses;
    mapping(address => bool) public authorizedWallets;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory initBaseURI_,
        uint256 devReserve_,
        uint96 royalty_,
        address payable devWalletAddress_,
        SaleConfig memory saleConfig_,
        uint256 _takeOverPrice
    ) ERC1155("") {
        name = name_;
        symbol = symbol_;
        _setDefaultRoyalty(devWalletAddress_, royalty_);

        mintPlan[0].devReserve = devReserve_;
        mintPlan[0].baseURI = initBaseURI_;
        mintPlan[0].isAvailable = true;

        takeOverPrice = _takeOverPrice;
        _devMultiSigWalletAddress = devWalletAddress_;

        setSaleConfig(
            0,
            saleConfig_.maxPerTransaction,
            saleConfig_.unitPrice,
            saleConfig_.discountedUnitPrice,
            saleConfig_.revenueSharePercentage,
            saleConfig_.exclusiveRevenueSharePercentage,
            saleConfig_.signerAddress
        );
    }

    /* 
        interface
    */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC1155, ERC2981) returns (bool) {
        return
            ERC1155.supportsInterface(interfaceId) ||
            super.supportsInterface(interfaceId);
    }

    /* 
        uri
    */
    function uri(uint256 typeId) public view override returns (string memory) {
        if (!mintPlan[typeId].isAvailable) {
            revert InvalidTokenId();
        }
        return
            bytes(mintPlan[typeId].baseURI).length > 0
                ? string(
                    abi.encodePacked(
                        mintPlan[typeId].baseURI,
                        typeId.toString()
                    )
                )
                : mintPlan[typeId].baseURI;
    }

    function updateBaseUri(
        uint256 typeId,
        string memory _baseURI
    ) external onlyOwner {
        mintPlan[typeId].baseURI = _baseURI;
    }

    function setRoyaltyInfo(
        address receiver,
        uint96 feeBasisPoints
    ) public onlyOwner {
        _setDefaultRoyalty(receiver, feeBasisPoints);
    }

    function withdrawETH() public onlyOwner {
        if (address(this).balance <= 0) {
            revert NoETHLeft();
        }
        (bool success, ) = address(owner()).call{value: address(this).balance}(
            ""
        );
        if (!success) {
            revert ETHTransferFailed();
        }
    }

    modifier canMint(uint256 typeId, uint256 amount) {
        _guardMint(typeId);

        unchecked {
            SaleConfig memory saleConfig = _saleConfig[typeId];
            if (!saleConfig.enabled) {
                revert SaleNotEnabled();
            }

            if (amount > saleConfig.maxPerTransaction) {
                revert ExceedsMaxPerTransaction();
            }
        }
        _;
    }

    function _guardMint(uint256 typeId) internal view virtual {
        unchecked {
            if (!mintPlan[typeId].isAvailable) {
                revert InvalidTokenId();
            }
        }
    }

    function setMintPlan(
        uint256 typeId,
        uint256 devReserve,
        string memory baseURI,
        bool isAvailable
    ) external onlyOwner {
        mintPlan[typeId].devReserve = devReserve;
        mintPlan[typeId].baseURI = baseURI;
        mintPlan[typeId].isAvailable = isAvailable;
    }

    function devMintTo(
        address to,
        uint256[] memory typeIds,
        uint256[] memory amounts
    ) external onlyOwner {
        uint256 n = typeIds.length;

        if (n != amounts.length) {
            revert InvalidInput();
        }

        for (uint256 i = 0; i < n; ++i) {
            if (amounts[i] > mintPlan[typeIds[i]].devReserve) {
                revert ExceedsDevReserve();
            }
            mintPlan[typeIds[i]].devReserve -= amounts[i];
        }

        _mintBatch(to, typeIds, amounts, "");
    }

    function getSaleConfig(
        uint256 typeId
    ) external view returns (SaleConfig memory) {
        return _saleConfig[typeId];
    }

    function setSaleConfig(
        uint256 typeId,
        uint256 maxPerTransaction,
        uint256 unitPrice,
        uint256 discountedUnitPrice,
        uint256 revenueSharePercentage,
        uint256 exclusiveRevenueSharePercentage,
        address signerAddress
    ) public onlyOwner {
        _saleConfig[typeId].maxPerTransaction = uint8(maxPerTransaction);
        _saleConfig[typeId].unitPrice = uint64(unitPrice);
        _saleConfig[typeId].discountedUnitPrice = uint64(discountedUnitPrice);
        _saleConfig[typeId].revenueSharePercentage = revenueSharePercentage;
        _saleConfig[typeId]
            .exclusiveRevenueSharePercentage = exclusiveRevenueSharePercentage;
        _saleConfig[typeId].signerAddress = signerAddress;
    }

    function setSaleStatus(uint256 typeId, bool enabled) external onlyOwner {
        if (_saleConfig[typeId].enabled != enabled) {
            _saleConfig[typeId].enabled = enabled;
            emit SaleStatusChange(typeId, enabled);
        }
    }

    function mint(
        uint256 typeId,
        uint256 amount
    ) external payable canMint(typeId, amount) {
        uint256 totalPrice = amount * _saleConfig[typeId].unitPrice;

        if (msg.value < totalPrice) {
            revert InsufficientFunds();
        }

        _handleMint(_msgSender(), typeId, amount);
    }

    function _handleMint(
        address recipient,
        uint256 typeId,
        uint256 amount
    ) internal {
        _mint(recipient, typeId, amount, "");
        emit Minted(recipient, typeId, amount);
    }

    function setTakeOverPrice(uint256 _takeOverPrice) external onlyOwner {
        takeOverPrice = _takeOverPrice;
    }

    function togglePayoutStatus(bool _isPayoutActive) external onlyOwner {
        if (isPayoutActive != _isPayoutActive) {
            isPayoutActive = _isPayoutActive;
        }
    }

    modifier onlyAuthorizedWallet() {
        if (!authorizedWallets[_msgSender()]) {
            revert NotAuthorizedWallet();
        }
        _;
    }

    function setAuthorizedWallet(
        address wallet,
        bool check
    ) external onlyOwner {
        authorizedWallets[wallet] = check;
    }

    function authorizedBurnBatch(
        address walletAddress,
        uint256[] memory typeIds,
        uint256[] memory amounts
    ) external onlyAuthorizedWallet {
        _burnBatch(walletAddress, typeIds, amounts);
    }

    function burnBatch(
        uint256[] memory typeIds,
        uint256[] memory amounts
    ) external {
        _burnBatch(_msgSender(), typeIds, amounts);
    }
}
