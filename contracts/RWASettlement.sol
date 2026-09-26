// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RWASettlement is AccessControl, ReentrancyGuard {
    bytes32 public constant SETTLEMENT_ROLE = keccak256("SETTLEMENT_ROLE");

    struct Trade {
        address buyer;
        address seller;
        address assetToken;
        uint256 assetAmount;
        address paymentToken;
        uint256 paymentAmount;
        bool settled;
    }

    uint256 public nextTradeId;
    mapping(uint256 => Trade) public trades;

    event TradeCreated(uint256 indexed tradeId, address indexed buyer, address indexed seller);
    event TradeSettled(uint256 indexed tradeId);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SETTLEMENT_ROLE, admin);
    }

    function createTrade(
        address buyer,
        address seller,
        address assetToken,
        uint256 assetAmount,
        address paymentToken,
        uint256 paymentAmount
    ) external onlyRole(SETTLEMENT_ROLE) returns (uint256 tradeId) {
        require(buyer != address(0) && seller != address(0), "Invalid party");
        require(assetToken != address(0) && paymentToken != address(0), "Invalid token");
        require(assetAmount > 0 && paymentAmount > 0, "Invalid amount");

        tradeId = nextTradeId++;
        trades[tradeId] = Trade(
            buyer,
            seller,
            assetToken,
            assetAmount,
            paymentToken,
            paymentAmount,
            false
        );

        emit TradeCreated(tradeId, buyer, seller);
    }


    // Demo-friendly investor purchase flow.
    // The buyer pays the payment token and receives the RWA token.
    // The seller must approve this settlement contract beforehand.
    function buyAsset(
        address seller,
        address assetToken,
        uint256 assetAmount,
        address paymentToken,
        uint256 paymentAmount
    ) external nonReentrant returns (uint256 tradeId) {
        require(seller != address(0), "Invalid seller");
        require(assetToken != address(0), "Invalid asset token");
        require(paymentToken != address(0), "Invalid payment token");
        require(assetAmount > 0 && paymentAmount > 0, "Invalid amount");

        tradeId = nextTradeId++;

        trades[tradeId] = Trade({
            buyer: msg.sender,
            seller: seller,
            assetToken: assetToken,
            assetAmount: assetAmount,
            paymentToken: paymentToken,
            paymentAmount: paymentAmount,
            settled: false
        });

        require(
            IERC20(assetToken).transferFrom(
                seller,
                msg.sender,
                assetAmount
            ),
            "Asset transfer failed"
        );

        require(
            IERC20(paymentToken).transferFrom(
                msg.sender,
                seller,
                paymentAmount
            ),
            "Payment transfer failed"
        );

        trades[tradeId].settled = true;

        emit TradeCreated(tradeId, msg.sender, seller);
        emit TradeSettled(tradeId);
    }

    function settle(uint256 tradeId)
        external
        nonReentrant
        onlyRole(SETTLEMENT_ROLE)
    {
        Trade storage t = trades[tradeId];
        require(!t.settled, "Already settled");

        require(
            IERC20(t.assetToken).transferFrom(
                t.seller,
                t.buyer,
                t.assetAmount
            ),
            "Asset transfer failed"
        );

        require(
            IERC20(t.paymentToken).transferFrom(
                t.buyer,
                t.seller,
                t.paymentAmount
            ),
            "Payment transfer failed"
        );

        t.settled = true;
        emit TradeSettled(tradeId);
    }
}
