pragma solidity ^0.6.10;
// SPDX-License-Identifier: GPL-3.0 pragma solidity >=0.4.16 <0.7.0;

library SafeMath {

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b);

        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0);
        uint256 c = a / b;

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        uint256 c = a - b;

        return c;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);

        return c;
    }
}

library strings {

    struct slice {
        uint _len;
        uint _ptr;
    }

    function memcpy(uint dest, uint src, uint len) private pure {
        // Copy word-length chunks while possible
        for(; len >= 32; len -= 32) {
            assembly {
                mstore(dest, mload(src))
            }
            dest += 32;
            src += 32;
        }

        // Copy remaining bytes
        uint mask = 256 ** (32 - len) - 1;
        assembly {
            let srcpart := and(mload(src), not(mask))
            let destpart := and(mload(dest), mask)
            mstore(dest, or(destpart, srcpart))
        }
    }

    function toSlice(string memory self) internal pure returns (slice memory) {
        uint ptr;
        assembly {
            ptr := add(self, 0x20)
        }
        return slice(bytes(self).length, ptr);
    }

    function join(slice memory self, slice[] memory parts) internal pure returns (string memory) {
        if (parts.length == 0)
            return "";

        uint length = self._len * (parts.length - 1);
        for(uint i = 0; i < parts.length; i++)
            length += parts[i]._len;

        string memory ret = new string(length);
        uint retptr;
        assembly { retptr := add(ret, 32) }


        for(uint256 i = 0; i < parts.length; i++) {
            memcpy(retptr, parts[i]._ptr, parts[i]._len);
            retptr += parts[i]._len;
            if (i < parts.length - 1) {
                memcpy(retptr, self._ptr, self._len);
                retptr += self._len;
            }
        }

        return ret;
    }

    function _bytes32ToStr(bytes32 x) internal pure returns (string memory) {
        uint charCount = 0;
        bytes memory bytesString = new bytes(32);
        for (uint j = 0; j < 32; j++) {
            byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            } else if (charCount != 0) {
                break;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (uint256 j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];

        }
        return string(bytesStringTrimmed);
    }

    function _stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        assembly {
            result := mload(add(source, 32))
        }
    }

    function _stringEq(string memory a, string memory b) internal pure returns (bool) {
        if((bytes(a).length == 0 && bytes(b).length == 0)) {
            return true;
        }
        if (bytes(a).length != bytes(b).length) {
            return false;
        } else {
            return _stringToBytes32(a) == _stringToBytes32(b);
        }
    }

}

contract SeroInterface {

    bytes32 private topic_sero_issueToken = 0x3be6bf24d822bcd6f6348f6f5a5c2d3108f04991ee63e80cde49a8c4746a0ef3;
    bytes32 private topic_sero_balanceOf = 0xcf19eb4256453a4e30b6a06d651f1970c223fb6bd1826a28ed861f0e602db9b8;
    bytes32 private topic_sero_send = 0x868bd6629e7c2e3d2ccf7b9968fad79b448e7a2bfb3ee20ed1acbc695c3c8b23;
    bytes32 private topic_sero_currency = 0x7c98e64bd943448b4e24ef8c2cdec7b8b1275970cfe10daf2a9bfa4b04dce905;
    bytes32 private topic_sero_setCallValues  =  0xa6cafc6282f61eff9032603a017e652f68410d3d3c69f0a3eeca8f181aec1d17;

    function sero_setCallValues(string memory _currency, uint256 _amount, string memory _category, bytes32 _ticket) internal {
        bytes memory temp = new bytes(0x80);
        assembly {
            mstore(temp, _currency)
            mstore(add(temp, 0x20), _amount)
            mstore(add(temp, 0x40), _category)
            mstore(add(temp, 0x60), _ticket)
            log1(temp, 0x80, sload(topic_sero_setCallValues_slot))
        }
        return;
    }
    function sero_msg_currency() internal returns (string memory) {
        bytes memory tmp = new bytes(32);
        bytes32 b32;
        assembly {
            log1(tmp, 0x20, sload(topic_sero_currency_slot))
            b32 := mload(tmp)
        }
        return strings._bytes32ToStr(b32);
    }

    function sero_issueToken(uint256 _total, string memory _currency) internal returns (bool success){
        bytes memory temp = new bytes(64);
        assembly {
            mstore(temp, _currency)
            mstore(add(temp, 0x20), _total)
            log1(temp, 0x40, sload(topic_sero_issueToken_slot))
            success := mload(add(temp, 0x20))
        }
    }

    function sero_send_token(address _receiver, string memory _currency, uint256 _amount) internal returns (bool success){
        return sero_send(_receiver, _currency, _amount, "", 0);
    }

    function sero_send(address _receiver, string memory _currency, uint256 _amount, string memory _category, bytes32 _ticket) internal returns (bool success){
        bytes memory temp = new bytes(160);
        assembly {
            mstore(temp, _receiver)
            mstore(add(temp, 0x20), _currency)
            mstore(add(temp, 0x40), _amount)
            mstore(add(temp, 0x60), _category)
            mstore(add(temp, 0x80), _ticket)
            log1(temp, 0xa0, sload(topic_sero_send_slot))
            success := mload(add(temp, 0x80))
        }
    }

}


contract Config {

    uint256 constant TREETIMES = 1e21;
    uint256 constant FIVETIMES = 5e21;

    uint256 constant kingAmount = 5e22;
    uint256 constant baron_large_total = 1e23;
    uint256 constant baron_little_total = 2e23;

    uint256 constant earl_large_total = 2e23;
    uint256 constant earl_little_total = 4e23;

    uint256 constant marquess_large_total = 4e23;
    uint256 constant marquess_little_total = 8e23;

    uint256 constant duke_large_total = 8e23;
    uint256 constant duke_little_total = 16e23;
}

contract InvestorRelationship is Config, SeroInterface {
    using SafeMath for uint256;
    uint256 constant private MAXHEIGHT = 300;
    uint256 constant ONEDAY = 24*60*60;

    struct Investor {
        uint256 refereeId;
        uint256 largeAreaId;

        uint256 amount;
        uint256 totalAmount;
        uint256 returnAmount;
        uint256 achievement;
        uint256 otherAchievement;
        uint256 weekRecommendAmount;

        address addr;
        uint8 star;
        bool isKing;
    }

    struct Profit {
        uint256 canWithdrawBalance;
        uint256 withdrawTimestamp;
        uint256 staticReward;
        uint256 recommendReward;
        uint256 starReward;
        uint256 vipReward;
        uint256 currentStaticReward;
        uint256 staticTimestamp;
        uint256 updateTimestamp;
    }


    mapping(uint256=>uint256) timestamps;

    uint256 public poolBalance;
    uint256 public totalShare;
    uint256 public drawTime;

    mapping(address => uint256) indexs;
    Investor[] investors;
    Profit[] profits;

    uint256[] public topTenIds = [0,0,0,0,0,0,0,0,0,0];
    uint256 public topTenLen;
    uint256 public topTenReward;

    uint256 preTopTenReward;
    uint256 preTopTenLen;
    uint256[] preTopTenIds = [0,0,0,0,0,0,0,0,0,0];
    uint256[] preTopTenRewards = [0,0,0,0,0,0,0,0,0,0];
    uint256[] preRecommentAmounts = [0,0,0,0,0,0,0,0,0,0];

    uint256 groupNum = 20;
    uint256 withdrawInterval = 3 * ONEDAY;

    mapping(uint256 => address) public investorAddrs;

    using SafeMath for uint256;

    constructor() public {
        investors.push(Investor({refereeId : 0, largeAreaId : 0, amount : 0, totalAmount : 0, returnAmount : 0, achievement : 0, otherAchievement : 0, addr : address(0), star : 0, isKing : false, weekRecommendAmount:0}));
        profits.push(Profit({canWithdrawBalance : 0, withdrawTimestamp:0, staticReward : 0, recommendReward : 0, starReward : 0, vipReward : 0, currentStaticReward : 0, staticTimestamp : 0, updateTimestamp : 0}));
    }

    function topTen(uint256 _id) internal {
        if (topTenLen == 0) {
            topTenLen = 1;
            topTenIds[0] = _id;
        } else {
            uint256 _minIndex;
            for (uint256 i = 0; i < topTenLen; i++) {
                if (_id == topTenIds[i]) {
                    return;
                }
                if(investors[topTenIds[i]].weekRecommendAmount < investors[topTenIds[_minIndex]].weekRecommendAmount) {
                    _minIndex = i;
                }
            }

            if (topTenLen < 10) {
                topTenIds[topTenLen] = _id;
                topTenLen++;
            } else if(investors[_id].weekRecommendAmount > investors[topTenIds[_minIndex]].weekRecommendAmount) {
                topTenIds[_minIndex] = _id;
            }
        }
    }

    function group(uint256 id) internal view returns(uint256[] memory rets) {
        uint256 len = groupNum;
        uint256 start = groupFirst(id);
        if (start + groupNum > investors.length) {
            len = investors.length - start;
        }

        rets = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            rets[i] = start + i;
        }
    }

    function groupFirst(uint256 id) internal view returns(uint256) {
        require(id!=0);
        id -=1;
        return id - id % groupNum + 1;
    }

    function findByAddr(address addr) internal view returns (Investor memory) {
        return investors[indexs[addr]];
    }

    function findById(uint256 id) internal view returns (Investor memory) {
        return investors[id];
    }

    function getIndexByAddr(address addr) internal view returns (uint256) {
        return indexs[addr];
    }

    function _withdrawBalance(address addr) internal returns (uint256 amount) {
        uint256 index = getIndexByAddr(addr);
        require(index != 0);
        require(now - profits[index].withdrawTimestamp > withdrawInterval);
        amount = profits[index].canWithdrawBalance;
        profits[index].canWithdrawBalance = 0;
        profits[index].withdrawTimestamp = now;
    }

    function _triggerStaticProfit(uint256 id) internal {

        uint256 allProfit;
        uint256[] memory list = group(id);

        for(uint256 i=0;i< list.length;i++) {
            if (investors[list[i]].amount != 0) {
                allProfit += _payStaticProfit(list[i]);
            } else {
                profits[list[i]].staticTimestamp = now;
            }
        }
        poolBalance = poolBalance.sub(allProfit);
        totalShare = totalShare.sub(allProfit);
    }

    function _insert(uint256 refereeId,address addr) internal {
        indexs[addr] = investors.length;
        investorAddrs[investors.length] = addr;
        investors.push(Investor({refereeId : refereeId, largeAreaId : 0, amount : 0, totalAmount : 0, returnAmount : 0, achievement : 0, otherAchievement : 0, addr : addr, star : 0, isKing : false, weekRecommendAmount:0}));
        profits.push(Profit({canWithdrawBalance : 0, withdrawTimestamp:0, staticReward : 0, recommendReward : 0, starReward : 0, vipReward : 0, currentStaticReward : 0, staticTimestamp : 0, updateTimestamp : 0}));
    }

    function _invest(uint256 id, uint256 amount) internal {

        investors[id].amount = investors[id].amount.add(amount);
        investors[id].totalAmount = investors[id].totalAmount.add(amount);

        if (amount >= kingAmount) {
            investors[id].isKing = true;
        }

        uint256 currentId = investors[id].refereeId;

        if (currentId != 0 ) {
            if (timestamps[currentId] <= drawTime) {
                investors[currentId].weekRecommendAmount = amount;
                timestamps[currentId] = now;
            } else {
                investors[currentId].weekRecommendAmount = investors[currentId].weekRecommendAmount.add(amount);
            }

            if(investors[currentId].amount !=0) {
                topTen(currentId);
            }
        }

        uint256 childId = id;
        uint256 height;
        uint256 otherAmount = amount;
        while (currentId != uint256(0)) {

            if (investors[childId].otherAchievement != 0) {
                otherAmount = otherAmount.add(investors[childId].otherAchievement);
                investors[childId].otherAchievement = 0;
            }

            if (height == MAXHEIGHT && investors[currentId].refereeId != 0) {
                investors[currentId].otherAchievement = investors[currentId].otherAchievement.add(otherAmount);
                break;
            } else {
                investors[currentId].achievement = investors[currentId].achievement.add(otherAmount);
            }

            if (investors[currentId].largeAreaId == 0) {
                investors[currentId].largeAreaId = childId;
            } else {

                uint256 largeAreaId = investors[currentId].largeAreaId;
                uint256 largeAchievement = investors[largeAreaId].achievement.add(investors[largeAreaId].totalAmount);
                uint256 childAchievement = investors[childId].achievement.add(investors[childId].totalAmount);

                if (investors[currentId].largeAreaId != childId && childAchievement > largeAchievement) {
                    investors[currentId].largeAreaId = childId;
                    largeAchievement = childAchievement;
                }

                uint256 littleAchievement = (investors[currentId].achievement.add(investors[currentId].otherAchievement)).sub(largeAchievement);
                uint8 star;
                if (largeAchievement >= duke_large_total && littleAchievement >= duke_little_total) {
                    star = 4;
                } else if (largeAchievement >= marquess_large_total && littleAchievement >= marquess_little_total) {
                    star = 3;
                } else if (largeAchievement >= earl_large_total && littleAchievement >= earl_little_total) {
                    star = 2;
                } else if (largeAchievement >= baron_large_total && littleAchievement >= baron_little_total) {
                    star = 1;
                } else {
                    star = 0;
                }
                if (star > investors[currentId].star) {
                    investors[currentId].star = star;
                }

            }
            height++;
            (childId, currentId) = (currentId, investors[currentId].refereeId);
        }

        uint256 allProfit;
        allProfit += _recommendProfit(investors[id].refereeId, amount);
        allProfit += _starProfit(investors[id].refereeId, amount);
        allProfit += _vipProfit(investors[id].refereeId, amount);

        poolBalance = poolBalance.sub(allProfit);

        uint256 addShare = amount.mul(5);
        addShare = addShare.sub(allProfit);
        totalShare = totalShare.add(addShare);
    }


    function _payStaticProfit(uint256 id) internal returns (uint256) {

        uint256 totalProfit = investors[id].amount.mul(5);
        uint256 currentShare = totalProfit.sub(investors[id].returnAmount);
        uint256 profit = poolBalance.mul(currentShare) / totalShare;
        uint256 maxprofit = totalProfit.mul(14) / 10000;
        if (profit > maxprofit) {
            profit = maxprofit;
        }
        profit = _payProfit(id, profit);

        profits[id].staticTimestamp = now;
        profits[id].staticReward = profits[id].staticReward.add(profit);
        profits[id].currentStaticReward = profit;
        return profit;
    }


    function _starProfit(uint256 id, uint256 amount) internal returns (uint256 allProfit) {
        if (id == 0) {
            return 0;
        }

        uint256 height;
        uint256 rate;
        while (id != 0 && height < MAXHEIGHT && rate < 12) {

            if (investors[id].star == 0 || investors[id].amount == 0) {
                id = investors[id].refereeId;
                height++;
                continue;
            }

            uint currentRate = investors[id].star * 3;
            if (currentRate <= rate) {
                id = investors[id].refereeId;
                height++;
                continue;
            }

            (rate, currentRate) = (currentRate, currentRate - rate);
            uint256 profit = amount.mul(currentRate) / 100;

            profit = _payProfit(id, profit);
            profits[id].starReward = profits[id].starReward.add(profit);
            allProfit += profit;

            id = investors[id].refereeId;
            height++;
        }
    }

    function _vipProfit(uint256 id, uint256 amount) internal returns (uint256 profit) {
        if (id == 0) {
            return 0;
        }

        uint256 height;
        while (id != 0 && !investors[id].isKing && height < MAXHEIGHT) {
            id = investors[id].refereeId;
            height++;
        }

        if (id != 0 && investors[id].isKing) {
            profit = _payProfit(id, amount / 20);
            profits[id].vipReward = profits[id].vipReward.add(profit);
        }
    }

    function _recommendProfit(uint256 firstId, uint256 amount) internal returns (uint256) {
        if (firstId == 0) {
            return 0;
        }

        uint256 allProfit;
        allProfit += _caleRecommendProfit(firstId, amount, 10);
        uint256 secondId = investors[firstId].refereeId;

        if (secondId != uint256(0)) {
            allProfit += _caleRecommendProfit(secondId, amount, 8);

            uint256 layer = 3;
            uint256 id = investors[secondId].refereeId;
            while (id != uint256(0) && layer <= 9) {
                allProfit += _caleRecommendProfit(id, amount, 1);
                id = investors[id].refereeId;
                layer += 1;
            }

        }
        return allProfit;
    }

    function _caleRecommendProfit(uint256 id, uint256 amount, uint256 rate) internal returns (uint256) {
        if (investors[id].amount == 0) {
            return 0;
        }

        uint256 profile = amount.mul(rate) / 100;
        profile = _payProfit(id, profile);
        profits[id].recommendReward = profits[id].recommendReward.add(profile);
        return profile;
    }

    function _payProfit(uint id, uint256 amount) internal returns (uint256) {

        uint256 totalProfit = investors[id].amount.mul(5);
        if (amount.add(investors[id].returnAmount) > totalProfit) {
            amount = totalProfit.sub(investors[id].returnAmount);
        }

        investors[id].returnAmount = investors[id].returnAmount.add(amount);
        if (investors[id].returnAmount >= totalProfit) {
            investors[id].amount = 0;
            investors[id].returnAmount = 0;
            investors[id].isKing = false;

            profits[id].staticReward = 0;
            profits[id].recommendReward = 0;
            profits[id].starReward = 0;
            profits[id].vipReward = 0;
        }

        profits[id].canWithdrawBalance = profits[id].canWithdrawBalance.add(amount);
        return amount;
    }

    function _runALottery() internal {
        drawTime = now;
        preTopTenReward = topTenReward;
        if(topTenLen > 0 && topTenReward > 0) {
            preTopTenLen = topTenLen;

            uint256 allRecommendAmount;
            for(uint256 i=0;i<topTenLen;i++) {
                preRecommentAmounts[i] = investors[topTenIds[i]].weekRecommendAmount;
                allRecommendAmount += investors[topTenIds[i]].weekRecommendAmount;
            }

            uint256 reward;
            uint256 id;
            for(uint256 i=0;i<topTenLen;i++) {
                id = topTenIds[i];
                reward = topTenReward.mul(investors[id].weekRecommendAmount).div(allRecommendAmount);
                preTopTenIds[i] = id;
                preTopTenRewards[i] = reward;
                profits[id].canWithdrawBalance = profits[id].canWithdrawBalance.add(reward);
            }
            topTenLen = 0;
            topTenReward = 0;
        } else if(preTopTenLen != 0) {
            preTopTenLen = 0;
        }
    }
}


contract Ownable {

    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

interface CodeService {

    function encode(uint64 n) external view returns (string memory);

    function decode(string memory code) external view returns (uint);
}

interface MarketDex{

    function sellWithChangeRate(string memory payCoin,address receiverAddr ,uint256 changeRate) external payable returns(uint256 orderId);
}



contract Gail is InvestorRelationship, Ownable {

    using SafeMath for uint256;
    string private constant SERO_CURRENCY = "SERO";
    string private constant TICKET_CURRENCY = "GAIL";
    uint256 private constant MILLION = 1e24;

    uint256 private allIncome;
    mapping(address => uint256) private seroBalances;
    mapping(address => uint256) private ticketBalances;

    address[2] public marketAddrs;
    address public prizeMaker;
    address public ticketAddr;

    CodeService public codeService;
    MarketDex public dex;

    constructor(address[2] memory _marketAddrs, address _ticketAddr,  address _prizeMaker, address _codeServiceAddr) public payable {
        marketAddrs = _marketAddrs;
        prizeMaker = _prizeMaker;
        ticketAddr = _ticketAddr;
        codeService = CodeService(_codeServiceAddr);
    }

    function setDexAddr(address _dexAddr) public onlyOwner {
        dex = MarketDex(_dexAddr);
    }

    function setMarketAddr(address[2] memory addrs) public onlyOwner {
        marketAddrs = addrs;
    }

    function setPrizeMaker(address _prizeMaker) public onlyOwner {
        prizeMaker = _prizeMaker;
    }

    function setTicketAddr(address _ticketAddr) public onlyOwner {
        ticketAddr = _ticketAddr;
    }

    function setWithdrawInterval(uint256 _withdrawInterval) public onlyOwner {
        withdrawInterval = _withdrawInterval;
    }

    function balanceOf() internal view returns (uint256, uint256) {
        return (seroBalances[msg.sender], ticketBalances[msg.sender]);
    }

    function codeExist(string memory code) public view returns (bool) {
        uint256 index = codeService.decode(code);
        return index != 0 && index < investors.length;
    }

    function getAddress(string memory code) public view returns (address) {
        uint256 index = codeService.decode(code);
        require(index != 0 && index < investors.length);
        return investorAddrs[index];
    }

    function details() public view
    returns (string memory code, string memory refereeCode, string memory largeAreaCode, uint256 amount,
        uint256 returnAmount, uint256 achievement, uint256 largeAchievement, uint256 seroBalance, uint256 ticketBalance, uint8 star, bool isKing )  {
        uint256 id = getIndexByAddr(msg.sender);
        if(id == 0) {
            return ("", "", "", 0, 0, 0, 0, 0, 0, 0, false);
        }
        Investor memory i = investors[id];

        code = codeService.encode(uint64(id));
        if(i.refereeId != 0) {
            refereeCode = codeService.encode(uint64(i.refereeId));
        }

        amount = i.amount;
        returnAmount = i.returnAmount;
        achievement = i.achievement;

        if(i.largeAreaId != 0) {
            largeAreaCode = codeService.encode(uint64(i.largeAreaId));
            largeAchievement = investors[i.largeAreaId].achievement.add(investors[i.largeAreaId].totalAmount);
        }
        (seroBalance,ticketBalance) = balanceOf();

        star = i.star;
        isKing = i.isKing;
    }

    function detailsOfIncome() public view returns (uint256, uint256 ,uint256, uint256, uint256, uint256, uint256, uint256){

        uint256 index = getIndexByAddr(msg.sender);
        if(index ==0) {
            return (0,0,0,0,0,0,0,0);
        }

        uint256 staticTimestamp = profits[groupFirst(index)].staticTimestamp;

        return (profits[index].canWithdrawBalance,
        profits[index].withdrawTimestamp,
        calcuStaticProfit(),
        profits[index].staticReward,
        profits[index].recommendReward,

        profits[index].starReward,
        profits[index].vipReward,
        staticTimestamp);
    }

    function calcuStaticProfit() internal view returns(uint256) {
        if(totalShare == 0) {
            return 0;
        }
        uint256 id = getIndexByAddr(msg.sender);
        if (now-profits[id].staticTimestamp<ONEDAY) {
            return profits[id].currentStaticReward;
        } else {
            uint256 totalProfit = investors[id].amount.mul(5);
            uint256 currentShare = totalProfit.sub(investors[id].returnAmount);
            uint256 profit = poolBalance.mul(currentShare) / totalShare;
            uint256 maxprofit = totalProfit.mul(14) / 10000;
            if (profit > maxprofit) {
                profit = maxprofit;
            }
            return  profit;
        }
    }

    function topTenInfo() public view returns(string memory codes, uint256[] memory, uint256, uint256, uint256[] memory){
        strings.slice[] memory parts = new strings.slice[](preTopTenLen);
        uint256[] memory vlues = new uint256[](preTopTenLen);
        for(uint256 i=0;i<preTopTenLen;i++) {
            parts[i] =strings.toSlice(codeService.encode(uint64(preTopTenIds[i])));
            vlues[i] = preTopTenRewards[i];
        }
        return(strings.join(strings.toSlice(","), parts), vlues, topTenReward, preTopTenReward, preRecommentAmounts);
    }

    function triggerStaticProfit() public {
        uint256 index = getIndexByAddr(msg.sender);
        require(index != 0);
        require((now - profits[groupFirst(index)].staticTimestamp) > ONEDAY);
        _triggerStaticProfit(index);
    }

    function sell(string memory token, uint256 changeRate) public {
        require(address(dex) != address(0), "not set dex");

        uint256 index = getIndexByAddr(msg.sender);
        require(index != 0);
        uint value = _withdrawBalance(msg.sender);
        if (value > 0) {
            sero_setCallValues(SERO_CURRENCY, value, "", bytes32(0));
            require(dex.sellWithChangeRate(token, msg.sender, changeRate) != 0);
        }
    }

    function withdrawBalance() public {
        uint value = _withdrawBalance(msg.sender);
        if (value > 0) {
            require(sero_send_token(msg.sender, SERO_CURRENCY, value));
        }
    }

    function registerNode(address addr) public onlyOwner {
        _insert(0, addr);
    }

    function _usedTicket(address investor) internal returns (uint256) {
        if(ticketBalances[investor] == 0 || seroBalances[investor] == 0) {
            return 0;
        }

        uint256 rate = conversionRate();
        uint256 amount = seroBalances[investor];
        uint256 needTicket = amount /rate;

        if (ticketBalances[investor] < needTicket) {
            needTicket = ticketBalances[investor];
            amount = ticketBalances[investor].mul(rate);
        }

        seroBalances[investor] = seroBalances[investor].sub(amount);
        ticketBalances[investor] = ticketBalances[investor].sub(needTicket);
        require(sero_send_token(ticketAddr, TICKET_CURRENCY, needTicket));
        return amount;
    }

    function Agent(bytes memory opData) external payable returns(bool) {
        (address investor, string memory code) = abi.decode(opData,(address,string));
        return _invest(code, investor, msg.value);
    }

    function invest(string memory refereeCode, address investor) public payable returns (bool){
        if(investor == address(0)) {
            investor = msg.sender;
        }
        return  _invest(refereeCode, investor, msg.value);
    }

    function _invest(string memory refereeCode, address investor, uint256 value) internal returns (bool) {
        if(strings._stringEq(SERO_CURRENCY, sero_msg_currency()))  {
            seroBalances[investor] = seroBalances[investor].add(value);
        } else if(strings._stringEq(TICKET_CURRENCY, sero_msg_currency())) {
            ticketBalances[investor] = ticketBalances[investor].add(value);
        } else {
            require(false, "currency is error");
        }

        uint256 index = getIndexByAddr(investor);
        if (index == 0) {
            uint256 refereeId = codeService.decode(refereeCode);
            require(refereeId != 0 && refereeId < investors.length);
            _insert(refereeId, investor);
        }

        uint256 amount = _usedTicket(investor);
        if(amount == 0) {
            return true;
        }

        allIncome = allIncome.add(amount);

        require(sero_send_token(owner, SERO_CURRENCY, amount / 100));
        require(sero_send_token(marketAddrs[0], SERO_CURRENCY, amount.mul(12) / 1000));
        require(sero_send_token(marketAddrs[1], SERO_CURRENCY, amount.mul(8) / 1000));

        poolBalance += (amount - amount*3/100);

        _invest(index, amount);
        return true;
    }

    function runALottery() public payable {
        require(msg.sender == prizeMaker);
        _runALottery();
        require(strings._stringEq(SERO_CURRENCY, sero_msg_currency()));
        topTenReward += msg.value;
    }

    function conversionRate() public view returns (uint256) {
        if (allIncome < MILLION) {
            return 200;
        }

        uint256 m = allIncome / MILLION;
        return 200 + m*2;
    }
}