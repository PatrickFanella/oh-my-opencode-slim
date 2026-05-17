# Nft Standards

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `nft-standards-skill.md`

_Source topic: nft-standards_

**Purpose:** Implement NFT standards (ERC-721, ERC-1155) with proper metadata handling, minting strategies, and marketplace integration. Use when creating NFT contracts, building NFT marketplaces, or implementing digital asset systems.

# NFT Standards

Master ERC-721 and ERC-1155 NFT standards, metadata best practices, and advanced NFT features.

## When to Use This Skill

- Creating NFT collections (art, gaming, collectibles)
- Implementing marketplace functionality
- Building on-chain or off-chain metadata
- Creating soulbound tokens (non-transferable)
- Implementing royalties and revenue sharing
- Developing dynamic/evolving NFTs

## ERC-721 (Non-Fungible Token Standard)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyNFT is ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MINT_PRICE = 0.08 ether;
    uint256 public constant MAX_PER_MINT = 20;

    constructor() ERC721("MyNFT", "MNFT") {}

...
```

## ERC-1155 (Multi-Token Standard)
...


### From `MERGED.md`

_Source topic: MERGED_

# Merged skill: nft-standards
Source path: `skills/security/nft-standards`
Canonical skill: `skills/security/solidity-security`
