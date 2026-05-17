# Defi Protocol Templates

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `defi-protocol-templates-skill.md`

_Source topic: defi-protocol-templates_

**Purpose:** Implement DeFi protocols with production-ready templates for staking, AMMs, governance, and lending systems. Use when building decentralized finance applications or smart contract protocols.

# DeFi Protocol Templates

Production-ready templates for common DeFi protocols including staking, AMMs, governance, lending, and flash loans.

## When to Use This Skill

- Building staking platforms with reward distribution
- Implementing AMM (Automated Market Maker) protocols
- Creating governance token systems
- Developing lending/borrowing protocols
- Integrating flash loan functionality
- Launching yield farming platforms

## Staking Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingRewards is ReentrancyGuard, Ownable {
    IERC20 public stakingToken;
    IERC20 public rewardsToken;

    uint256 public rewardRate = 100; // Rewards per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balances;
...
```

## AMM (Automated Market Maker)
...


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: defi-protocol-templates
Source path: `skills/backend-architecture/defi-protocol-templates`
Canonical skill: `skills/security/solidity-security`
