// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ProofRegistry {
    // --- Structs ---
    struct Proof {
        bytes32 proofHash;
        address submitter;
        string evidenceReference;
        uint256 timestamp;
    }

    // --- State ---
    address public owner;
    mapping(bytes32 => Proof) public proofs;
    bytes32[] public proofHashes;

    // --- Events ---
    event ProofRegistered(
        bytes32 indexed proofHash,
        address indexed submitter,
        string evidenceReference,
        uint256 timestamp
    );

    // --- Constructor ---
    constructor() {
        owner = msg.sender;
    }

    // --- Core Functions ---
    function registerProof(
        bytes32 proofHash,
        string memory evidenceReference
    ) external {
        require(proofHash != bytes32(0), "Hash cannot be zero");
        require(
            bytes(proofs[proofHash].evidenceReference).length == 0,
            "Proof already exists"
        );

        proofs[proofHash] = Proof({
            proofHash: proofHash,
            submitter: msg.sender,
            evidenceReference: evidenceReference,
            timestamp: block.timestamp
        });

        proofHashes.push(proofHash);

        emit ProofRegistered(
            proofHash,
            msg.sender,
            evidenceReference,
            block.timestamp
        );
    }

    function verifyProof(
        bytes32 proofHash
    )
        external
        view
        returns (
            bool exists,
            address submitter,
            string memory evidenceReference,
            uint256 timestamp
        )
    {
        Proof storage proof = proofs[proofHash];
        exists = bytes(proof.evidenceReference).length != 0;
        submitter = proof.submitter;
        evidenceReference = proof.evidenceReference;
        timestamp = proof.timestamp;
    }

    function proofExists(bytes32 proofHash) external view returns (bool) {
        return bytes(proofs[proofHash].evidenceReference).length != 0;
    }

    function getProofCount() external view returns (uint256) {
        return proofHashes.length;
    }
}
