// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../utils/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OfmxERC20 is
    ERC20("OFM Market Utility", "Ofmx"),
    AccessControl,
    Pausable,
    Ownable
{
    /**
     * @dev Smart contract unique identifier, a random number
     * @dev Should be regenerated each time smart contact source code is changed
     *      and changes smart contract itself is to be redeployed
     * @dev Generated using https://www.random.org/bytes/
     */
    uint256 public constant TOKEN_UID =
        0x506c755d00080277aed3c606fab05fcff22d707e477ea5ebd2efdf3a58e96e01;

    /**
     * @notice Token creator is responsible for creating (minting)
     *      tokens to an arbitrary address
     * @dev Role ROLE_TOKEN_CREATOR allows minting tokens
     *      (calling `mint` function)
     */
    uint32 public constant ROLE_TOKEN_CREATOR = 0x0001_0000;

    /**
     * @notice Must be called by ROLE_TOKEN_CREATOR addresses.
     *
     * @param recipient address to receive the tokens.
     * @param amount number of tokens to be minted.
     */
    function mint(address recipient, uint256 amount) external {
        require(
            isSenderInRole(ROLE_TOKEN_CREATOR),
            "insufficient privileges (ROLE_TOKEN_CREATOR required)"
        );
        _mint(recipient, amount);
    }

    /**
     * @param amount number of tokens to be burned.
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice To be called by owner only to pause/unpause the contract.
     * @param shouldPause boolean to toggle contract pause state.
     */
    function pause(bool shouldPause) external onlyOwner {
        if (shouldPause) {
            _pause();
        } else {
            _unpause();
        }
    }
}
