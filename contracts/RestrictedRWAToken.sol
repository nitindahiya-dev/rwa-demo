// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Whitelist.sol";

contract RestrictedRWAToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    Whitelist public immutable whitelist;
    bytes32 public immutable assetId;

    constructor(
        string memory name_,
        string memory symbol_,
        bytes32 assetId_,
        address admin,
        address whitelist_
    ) ERC20(name_, symbol_) {
        require(admin != address(0), "Invalid admin");
        require(whitelist_ != address(0), "Invalid whitelist");

        assetId = assetId_;
        whitelist = Whitelist(whitelist_);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
    }

    function mint(address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
    {
        require(whitelist.approved(to), "Recipient not approved");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount)
        external
        onlyRole(BURNER_ROLE)
    {
        _burn(from, amount);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        if (from != address(0)) {
            require(whitelist.approved(from), "Sender not approved");
        }
        if (to != address(0)) {
            require(whitelist.approved(to), "Recipient not approved");
        }
        super._update(from, to, value);
    }
}
