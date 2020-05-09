function SeatSys() {
    // const SEATS_ROW_LEN = 400;
    // const SEATS_COL_LEN = 25;
    // const SEATS_REDUCE = 2;
    // const SEATS_FRONT = 0.4;
    // 以下为测试用选座
    const SEATS_ROW_LEN = 20;
    const SEATS_COL_LEN = 5;
    const SEATS_REDUCE = 1;
    const SEATS_FRONT = 0.4;

    let SEATS = [];
    // 初始化位置
    const initSeats = () => {
        let seats = [];
        let tmpArr = Array(SEATS_ROW_LEN).fill(1);
        for (let i = 0; i < SEATS_COL_LEN; i++) {
            let row = Array.from(tmpArr);
            let reduceNum = i * SEATS_REDUCE * 2;
            while (reduceNum > 0) {
                row[reduceNum - 1] = 0;
                row[SEATS_ROW_LEN - reduceNum] = 0;
                reduceNum--;
            }
            seats.push(row);
        }
        SEATS = seats;
    }
    // 获取座位所在区域
    const getSeatArea = coord => {
        let [row, col] = coord;
        let start = row * SEATS_REDUCE * 2;
        let rowLen = SEATS_ROW_LEN - (row * SEATS_REDUCE * 4);
        let end = start + rowLen;
        let diff = rowLen / 4;
        if (col >= start && col <= end) {
            col = col - start;
            if (col < diff) {
                return 'A'
            } else if(col < 2 * diff) {
                return 'B'
            } else if(col < 3 * diff) {
                return 'C'
            } else if(col < 4 * diff) {
                return 'D'
            }
        }
        return ' ';
    }
    // 打印位置 方便查看选座结果
    const printSeats = () => {
        // console.log(SEATS);
        for (let i = 0; i < SEATS.length; i++) {
            let row = SEATS[i];
            let rowStr = '';
            for (let j = 0; j < row.length; j++) {
                const ele = row[j];
                if(ele === 3) {
                    rowStr += ` S `;
                } else if (ele !== 0) {
                    rowStr += ` ${getSeatArea([i, j])} `;
                } else {
                    rowStr += ` ${getSeatArea([i, j])} `;
                }
            }
            console.log(rowStr);
        }
    }

    // 选座
    const checkSeat = (coord, conArr = []) => {
        let con = Array.from(conArr);
        let [i, j] = coord;
        let seat = SEATS[i][j];
        let isEmpyt = seat === 1;
        // 判断是否跨区域，自主设定: 考虑到体育场场景,不推荐跨区域连坐
        let isCross = con[0] && getSeatArea(coord) !== getSeatArea(con[0]) ? true : false;
        if (isEmpyt && !isCross) {
            con.push([i, j]);
        }
        return { con, isEmpyt, isCross };
    }
    // 处理备选方案
    const markSeat = (seats) => {
        console.log('确认选座: ', seats);
        for (let i = 0; i < seats.length; i++) {
            const [x, y] = seats[i];
            SEATS[x][y] = 3;
        }
        // printSeats();
    }
    // 区域遍历,按设定分区域遍历
    const forEachSeatByArea = (range, cb) => {
        let { area, startCol = SEATS_COL_LEN - 1, endCol = 0 } = range;
        while (startCol >= endCol) {
            let rowLen = SEATS_ROW_LEN - (startCol * SEATS_REDUCE * 4);
            let diff = rowLen / 4;
            let startR = SEATS_ROW_LEN / 2;
            let startL = startR - 1;
            if (area === 'AD') {
                startR = startR + diff;
                startL = startL - diff;
            }
            while (diff--) {
                let coordL = [startCol, startL];
                let coordR = [startCol, startR];
                let cbRes = cb('row', coordL, coordR);
                if (cbRes) {
                    return [coordL, coordR];
                }
                startR++;
                startL--;
            }
            cb('col');
            startCol--;
        }
    }
    const chooseContinuousSeats = (range, num) => {
        let bft = [];
        let res = [];
        let scatteredSeats = [];
        let conSeatsL = [];
        let conSeatsR = [];
        forEachSeatByArea(range, (type, coordL, coordR) => {
            if (type === 'row') {
                // 校验左边是否有连坐，有则返回
                const {con: conL, isEmpyt: isEmpytL} = checkSeat(coordL, conSeatsL);
                if (conL.length === num) {
                    res = conL;
                    return true;
                }
                // 将有连续座位的放入备选区域，如果整个轮下来没有连坐可以选，那么将基于这部分连坐进行前后排补位
                !isEmpytL && conSeatsL.length > 1 && bft.push(conSeatsL);
                // 校验右边是否有连坐，默认设定先左后右
                const {con: conR, isEmpyt: isEmpytR} = checkSeat(coordR, conSeatsR);
                if (conR.length === num) {
                    res = conR;
                    return true;
                }
                // 同左
                !isEmpytR && conSeatsR.length > 1 && bft.push(conSeatsR);
                conSeatsL = conL;
                conSeatsR = conR;
                // 如果后续发现没有合适的连坐，则可直接返回分散座位
                isEmpytL && scatteredSeats.length < num && scatteredSeats.push(coordL);
                isEmpytR && scatteredSeats.length < num && scatteredSeats.push(coordR);
            } else {
                conSeatsL.length > 1 && bft.push(conSeatsL);
                conSeatsR.length > 1 && bft.push(conSeatsR);
                // 换行，连坐置空
                conSeatsL = [];
                conSeatsR = [];
            }
            
        });
        return { res, bft, scatteredSeats }
    }
    const chooseAroundSeats = (choosedSeats, num) => {
        let aroundLen = num - choosedSeats.length;
        let top = [], bottom = [];
        // 可选正上方或者正下方
        for (let i = 0; i < choosedSeats.length; i++) {
            const [y, x] = choosedSeats[i];
            if (y + 1 < SEATS_COL_LEN) {
                bottom.push([y + 1, x]);
            }
            if (y - 1 >= 0) {
                top.push([y - 1, x]);
            }
        }
        // 当缺的比已选的多(目前设定下只有选2缺3)才能在正上(或下)左右超出一格
        if (aroundLen > choosedSeats.length) {
            let top0 = top[0] || [];
            let topEnd = top[top.length - 1] || [];
            let bottom0 = bottom[0] || [];
            let bottomEnd = bottom[bottom.length - 1] || [];
            SEATS[top0[0]] && top.push([top0[0], top0[1] - 1]);
            SEATS[bottom0[0]] && bottom.push([bottom0[0], bottom0[1]- 1]);
            SEATS[topEnd[0]] && top.push([topEnd[0], topEnd[1] + 1]);
            SEATS[bottomEnd[0]] && bottom.push([bottomEnd[0], bottomEnd[1] + 1]);
        }
        // 如果向上或者向下取值少于目标座位证明本次不能取
        if(top.length < aroundLen && bottom.length < aroundLen) {
            return;
        }
        // 自主设定: 优先靠前排,先从前排找空位
        let aroundTmp = [bottom, top];
        let res = [];
        for (let j = 0; j < aroundTmp.length; j++) {
            const tmp = aroundTmp[j];
            for (let i = 0; i < tmp.length; i++) {
                const coord = tmp[i];
                const { con } = checkSeat(coord, res);
                if (con.length === aroundLen) {
                    return con.concat(choosedSeats);
                }
                res = con;
            }
            res = [];
        }
    }
    const chooseSeats = num => {
        if (num < 1 || num > 5) {
            console.error('选票数量不符合规范');
            return [];
        }
        let frontcol = Math.floor(SEATS_FRONT * SEATS_COL_LEN);
        let scatteredSeats;
        let bft = [];
        let chooseParams = [
            // 自主设定: 按区域连坐选座，优先从前排 b c区域
            { area: 'BC', endCol: frontcol, startCol: SEATS_COL_LEN - 1 },
            // 自主设定: 按区域连坐选座，次优先从前排 a d区域
            { area: 'AD', endCol: frontcol, startCol: SEATS_COL_LEN - 1 },
            // 自主设定: 按区域连坐选座，次优先从后排排 b c区域
            { area: 'BC', endCol: 0, startCol: frontcol + 1 },
            // 自主设定: 按区域连坐选座，次优先从后排排 a d区域
            { area: 'AD', endCol: 0, startCol: frontcol + 1 },
        ];
        for (let i = 0; i < chooseParams.length; i++) {
            const params = chooseParams[i];
            let seatRes = chooseContinuousSeats(params, num);
            if (seatRes.res.length === num) {
                markSeat(seatRes.res);
                return seatRes.res;
            }
            bft = bft.concat(seatRes.bft);
            // 自主设定: 当整排无法连坐，则往已有连坐前后排插入，优先级同连坐
            if ((i + 1)% 2 === 0) {
                for (let i = 0; i < bft.length; i++) {
                    const item = bft[i];
                    const res = chooseAroundSeats(item, num);
                    if(res && res.length === num) {
                        markSeat(res);
                        return res;
                    }
                }
            }
            // 前后左右都没有，只能分散坐的保底选项, 分散坐优先级同连坐
            if (!scatteredSeats && seatRes.scatteredSeats.length === num) {
                scatteredSeats = seatRes.scatteredSeats;
            }
        }
        // 只能分散坐
        if (scatteredSeats && scatteredSeats.length === num) {
            return scatteredSeats
        }
        // 没有足够数量的可选座
        return [];
    }


    return {
        initSeats,
        printSeats,
        chooseSeats,
    }
}

// ------ 测试 -----
let seatSys = SeatSys();
seatSys.initSeats();
seatSys.printSeats();
seatSys.chooseSeats(0);
seatSys.chooseSeats(6);
seatSys.chooseSeats(2);
seatSys.chooseSeats(3);
seatSys.chooseSeats(4);
seatSys.chooseSeats(1);
seatSys.chooseSeats(3);
seatSys.chooseSeats(2);
seatSys.chooseSeats(3);
seatSys.chooseSeats(5);
seatSys.chooseSeats(5);
seatSys.printSeats();

// ---- 自主设定 ----
// 自主设定1: 按区域连坐选座, 优先从前排B C区域
// 自主设定2: 按区域连坐选座, 优先从前排A D区域
// 自主设定3: 当前排无法连坐, 则往已有连坐前后排插入，优先级同连坐(自主设定 1-4)
// 自主设定4: 按区域连坐选座, 次优先从后排B C区域
// 自主设定5: 按区域连坐选座, 次优先从后排A D区域
// 自主设定6: 当后排无法连坐, 则往已有连坐前后排插入，优先级同连坐(自主设定 1-4)
// 自主设定7: 当整排无法连坐, 且无法进行前后排选座，则分散坐，优先级同连坐(自主设定 1-4)
// 自主设定8: 考虑到体育场场景, 不推荐跨区域连坐


// ---- 运行说明 ----
// 运行环境: 本地采用node v11.6.0 版本直接执行，推荐node v10以上版本执行
// 固定参数:
//     SEATS_ROW_LEN 最高行座位个数
//     SEATS_COL_LEN 行数
//     SEATS_REDUCE 每行座位递减数量
//     SEATS_FRONT 前排占比 该参数决定了选座优先级
// 提供方法:
//     initSeats 初始化座位
//     printSeats 打印目前座位情况
//     chooseSeats 选座
// 备注: 为方便运行调试&展示结果，目前将座位数缩小，并打印选座结果
