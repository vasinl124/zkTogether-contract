pragma solidity ^0.8.18;

error ETHTransferFailed();

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);
}

contract Disperse {
    function disperseEther(
        address[] memory recipients,
        uint256[] memory values
    ) external payable {
        for (uint256 i = 0; i < recipients.length; i++) {
            (bool success, ) = payable(recipients[i]).call{value: values[i]}(
                ""
            );
            if (!success) {
                revert ETHTransferFailed();
            }
        }
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(msg.sender).call{value: balance}("");
            if (!success) {
                revert ETHTransferFailed();
            }
        }
    }

    function disperseToken(
        IERC20 token,
        address[] memory recipients,
        uint256[] memory values
    ) external {
        uint256 total = 0;
        for (uint256 i = 0; i < recipients.length; i++) total += values[i];
        require(token.transferFrom(msg.sender, address(this), total));
        for (uint256 i = 0; i < recipients.length; i++) {
            require(token.transfer(recipients[i], values[i]));
        }
    }

    function disperseTokenSimple(
        IERC20 token,
        address[] memory recipients,
        uint256[] memory values
    ) external {
        for (uint256 i = 0; i < recipients.length; i++)
            require(token.transferFrom(msg.sender, recipients[i], values[i]));
    }
}
