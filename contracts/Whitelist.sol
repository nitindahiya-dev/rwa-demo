// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Whitelist is AccessControl {
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    mapping(address => bool) public approved;

    event AddressApprovalUpdated(address indexed account, bool approved_);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(COMPLIANCE_ROLE, admin);
    }

    function setApproved(
        address account,
        bool approved_
    ) external onlyRole(COMPLIANCE_ROLE) {
        approved[account] = approved_;
        emit AddressApprovalUpdated(account, approved_);
    }

    function batchSetApproved(
        address[] calldata accounts,
        bool approved_
    ) external onlyRole(COMPLIANCE_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            approved[accounts[i]] = approved_;
            emit AddressApprovalUpdated(accounts[i], approved_);
        }
    }
}
