pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockPaymentToken is ERC20 {
    constructor() ERC20("Mock USD Coin", "mUSDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
