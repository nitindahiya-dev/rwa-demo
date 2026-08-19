// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract RWARegistry is AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    struct Asset {
        bytes32 id;
        string metadataURI;
        address token;
        address custodian;
        bool active;
    }

    mapping(bytes32 => Asset) private assets;

    event AssetRegistered(
        bytes32 indexed assetId,
        address indexed token,
        address indexed custodian,
        string metadataURI
    );
    event AssetStatusChanged(bytes32 indexed assetId, bool active);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
    }

    function registerAsset(
        bytes32 assetId,
        address token,
        address custodian,
        string calldata metadataURI
    ) external onlyRole(REGISTRAR_ROLE) {
        require(assetId != bytes32(0), "Invalid asset ID");
        require(token != address(0), "Invalid token");
        require(custodian != address(0), "Invalid custodian");
        require(assets[assetId].token == address(0), "Asset exists");

        assets[assetId] = Asset({
            id: assetId,
            metadataURI: metadataURI,
            token: token,
            custodian: custodian,
            active: true
        });

        emit AssetRegistered(assetId, token, custodian, metadataURI);
    }

    function setAssetStatus(
        bytes32 assetId,
        bool active
    ) external onlyRole(REGISTRAR_ROLE) {
        require(assets[assetId].token != address(0), "Unknown asset");
        assets[assetId].active = active;
        emit AssetStatusChanged(assetId, active);
    }

    function getAsset(bytes32 assetId) external view returns (Asset memory) {
        require(assets[assetId].token != address(0), "Unknown asset");
        return assets[assetId];
    }
}
