// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RWAToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    bytes32 public immutable overrideAssetId;

    error InvalidAddress();
    error InvalidAmount();

    constructor(
        string memory name_,
        string memory symbol_,
        bytes32 assetId_,
        address admin
    ) ERC20(name_, symbol_) {
        if (admin == address(0)) revert InvalidAddress();

        overrideAssetId = assetId_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
    }

    function assetId() external view returns (bytes32) {
        return overrideAssetId;
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        if (from == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        _burn(from, amount);
    }
}
