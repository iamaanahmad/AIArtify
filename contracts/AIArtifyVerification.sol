// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AIArtifyVerification
 * @dev LazAI Testnet contract for storing AI art verification data
 * 
 * This contract stores:
 * - Prompt hashes for tamper-proof verification
 * - LazAI reasoning results and consensus data
 * - Quality scores and node verification
 * - Cryptographic proofs of AI processing
 */
contract AIArtifyVerification {
    
    struct VerificationRecord {
        bytes32 promptHash;           // Hash of the original prompt
        bytes32 reasoningHash;        // Hash of LazAI reasoning output
        uint256 qualityScore;         // Quality score (0-10000, representing 0-100.00%)
        uint256 consensusNodes;       // Number of nodes that participated
        uint256 timestamp;            // When verification was recorded
        address verifier;             // Address that submitted verification
        string metadataUri;           // IPFS URI for detailed reasoning data
        bool isVerified;              // Whether this has been consensus-verified
    }
    
    // Mapping from artwork ID to verification record
    mapping(string => VerificationRecord) public verifications;
    
    // Mapping to track verifiers and their submission counts
    mapping(address => uint256) public verifierCounts;
    
    // Array to store all artwork IDs for enumeration
    string[] public artworkIds;
    
    // Events for transparency and indexing
    event VerificationStored(
        string indexed artworkId,
        bytes32 indexed promptHash,
        uint256 qualityScore,
        uint256 consensusNodes,
        address indexed verifier
    );
    
    event VerificationUpdated(
        string indexed artworkId,
        uint256 newQualityScore,
        uint256 newConsensusNodes
    );
    
    /**
     * @dev Store a new verification record
     * @param artworkId Unique identifier for the artwork
     * @param promptHash Hash of the original prompt
     * @param reasoningHash Hash of the LazAI reasoning output
     * @param qualityScore Quality score from consensus (0-10000)
     * @param consensusNodes Number of participating nodes
     * @param metadataUri IPFS URI containing detailed reasoning data
     */
    function storeVerification(
        string memory artworkId,
        bytes32 promptHash,
        bytes32 reasoningHash,
        uint256 qualityScore,
        uint256 consensusNodes,
        string memory metadataUri
    ) external {
        require(bytes(artworkId).length > 0, "Artwork ID cannot be empty");
        require(qualityScore <= 10000, "Quality score must be <= 10000");
        require(consensusNodes > 0, "Must have at least 1 consensus node");
        
        // Check if this is a new artwork
        bool isNewArtwork = verifications[artworkId].timestamp == 0;
        
        // Store the verification record
        verifications[artworkId] = VerificationRecord({
            promptHash: promptHash,
            reasoningHash: reasoningHash,
            qualityScore: qualityScore,
            consensusNodes: consensusNodes,
            timestamp: block.timestamp,
            verifier: msg.sender,
            metadataUri: metadataUri,
            isVerified: consensusNodes >= 3 // Auto-verify if 3+ nodes participated
        });
        
        // Add to artwork IDs if new
        if (isNewArtwork) {
            artworkIds.push(artworkId);
        }
        
        // Update verifier count
        verifierCounts[msg.sender]++;
        
        emit VerificationStored(
            artworkId,
            promptHash,
            qualityScore,
            consensusNodes,
            msg.sender
        );
    }
    
    /**
     * @dev Update an existing verification with new consensus data
     * @param artworkId The artwork to update
     * @param newQualityScore Updated quality score
     * @param newConsensusNodes Updated node count
     */
    function updateVerification(
        string memory artworkId,
        uint256 newQualityScore,
        uint256 newConsensusNodes
    ) external {
        require(verifications[artworkId].timestamp > 0, "Verification does not exist");
        require(newQualityScore <= 10000, "Quality score must be <= 10000");
        require(newConsensusNodes > 0, "Must have at least 1 consensus node");
        
        VerificationRecord storage record = verifications[artworkId];
        record.qualityScore = newQualityScore;
        record.consensusNodes = newConsensusNodes;
        record.isVerified = newConsensusNodes >= 3;
        
        emit VerificationUpdated(artworkId, newQualityScore, newConsensusNodes);
    }
    
    /**
     * @dev Get verification details for an artwork
     * @param artworkId The artwork to query
     * @return All verification data for the artwork
     */
    function getVerification(string memory artworkId) 
        external 
        view 
        returns (VerificationRecord memory) 
    {
        return verifications[artworkId];
    }
    
    /**
     * @dev Get the total number of verified artworks
     */
    function getTotalArtworks() external view returns (uint256) {
        return artworkIds.length;
    }
    
    /**
     * @dev Get artwork ID by index (for enumeration)
     * @param index The index to query
     */
    function getArtworkId(uint256 index) external view returns (string memory) {
        require(index < artworkIds.length, "Index out of bounds");
        return artworkIds[index];
    }
    
    /**
     * @dev Check if an artwork has been verified
     * @param artworkId The artwork to check
     */
    function isArtworkVerified(string memory artworkId) external view returns (bool) {
        return verifications[artworkId].isVerified;
    }
    
    /**
     * @dev Get verification statistics
     */
    function getStats() external view returns (
        uint256 totalArtworks,
        uint256 totalVerified,
        uint256 averageQuality
    ) {
        totalArtworks = artworkIds.length;
        uint256 totalQuality = 0;
        
        for (uint256 i = 0; i < artworkIds.length; i++) {
            VerificationRecord memory record = verifications[artworkIds[i]];
            if (record.isVerified) {
                totalVerified++;
            }
            totalQuality += record.qualityScore;
        }
        
        averageQuality = totalArtworks > 0 ? totalQuality / totalArtworks : 0;
    }
}
