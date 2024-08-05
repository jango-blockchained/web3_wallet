
/** 
 *  SourceUnit: /home/jango/Git/frappe_easy/frappe_docker/development/frappe-bench/apps/web3_wallet/web3_wallet/smart_contract/storage.sol
*/

////// SPDX-License-Identifier-FLATTEN-SUPPRESS-WARNING: MIT
pragma solidity ^0.8.0;

////import "@openzeppelin/contracts/access/AccessControl.sol";
////import "@openzeppelin/contracts/security/Pausable.sol";
////import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract TradingDataStorage is AccessControl, Pausable {
    using SafeMath for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant WRITER_ROLE = keccak256("WRITER_ROLE");
    bytes32 public constant READER_ROLE = keccak256("READER_ROLE");

    struct DataPoint {
        int256 integerValue;
        int256 floatValue; // Represented as fixed-point number: actual value = floatValue / 1e18
        uint256 timestamp;
    }

    mapping(address => mapping(uint256 => DataPoint)) private userData;
    mapping(address => uint256[]) private userTimestamps;

    event DataPointAdded(
        address indexed user,
        uint256 timestamp,
        int256 integerValue,
        int256 floatValue
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function addDataPoint(
        int256 _integerValue,
        int256 _floatValue
    ) external onlyRole(WRITER_ROLE) whenNotPaused {
        require(
            _floatValue >= -1e18 && _floatValue <= 1e18,
            "Float value out of range"
        );

        uint256 timestamp = block.timestamp;
        userData[msg.sender][timestamp] = DataPoint(
            _integerValue,
            _floatValue,
            timestamp
        );
        userTimestamps[msg.sender].push(timestamp);

        emit DataPointAdded(msg.sender, timestamp, _integerValue, _floatValue);
    }

    function getDataPoint(
        address _user,
        uint256 _timestamp
    ) external view onlyRole(READER_ROLE) returns (int256, int256) {
        DataPoint memory dp = userData[_user][_timestamp];
        require(dp.timestamp != 0, "Data point not found");
        return (dp.integerValue, dp.floatValue);
    }

    function getDataPoints(
        address _user,
        uint256 _startTime,
        uint256 _endTime
    )
        external
        view
        onlyRole(READER_ROLE)
        returns (int256[] memory, int256[] memory, uint256[] memory)
    {
        uint256[] storage timestamps = userTimestamps[_user];
        uint256 count = getDataPointsCount(_user, _startTime, _endTime);

        int256[] memory integerValues = new int256[](count);
        int256[] memory floatValues = new int256[](count);
        uint256[] memory filteredTimestamps = new uint256[](count);

        uint256 index = 0;
        for (uint256 i = 0; i < timestamps.length && index < count; i++) {
            if (timestamps[i] >= _startTime && timestamps[i] <= _endTime) {
                (
                    integerValues[index],
                    floatValues[index],
                    filteredTimestamps[index]
                ) = getDataPointValues(_user, timestamps[i]);
                index++;
            }
        }

        return (integerValues, floatValues, filteredTimestamps);
    }

    function getDataPointsCount(
        address _user,
        uint256 _startTime,
        uint256 _endTime
    ) private view returns (uint256) {
        uint256[] storage timestamps = userTimestamps[_user];
        uint256 count = 0;
        for (uint256 i = 0; i < timestamps.length; i++) {
            if (timestamps[i] >= _startTime && timestamps[i] <= _endTime) {
                count++;
            }
        }
        return count;
    }

    function getDataPointValues(
        address _user,
        uint256 timestamp
    ) private view returns (int256, int256, uint256) {
        DataPoint memory dp = userData[_user][timestamp];
        return (dp.integerValue, dp.floatValue, dp.timestamp);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function grantRole(
        bytes32 role,
        address account
    ) public override onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    function revokeRole(
        bytes32 role,
        address account
    ) public override onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }
}

