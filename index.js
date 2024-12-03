const { Requester, Validator } = require('@chainlink/external-adapter');
const axios = require('axios');

// 都道府県一覧（コードを追加）
const PREFECTURES = [
    { name: "北海道", code: "1" }, { name: "青森県", code: "2" }, { name: "岩手県", code: "3" },
    { name: "宮城県", code: "4" }, { name: "秋田県", code: "5" }, { name: "山形県", code: "6" },
    { name: "福島県", code: "7" }, { name: "茨城県", code: "8" }, { name: "栃木県", code: "9" },
    { name: "群馬県", code: "10" }, { name: "埼玉県", code: "11" }, { name: "千葉県", code: "12" },
    { name: "東京都", code: "13" }, { name: "神奈川県", code: "14" }, { name: "新潟県", code: "15" },
    { name: "富山県", code: "16" }, { name: "石川県", code: "17" }, { name: "福井県", code: "18" },
    { name: "山梨県", code: "19" }, { name: "長野県", code: "20" }, { name: "岐阜県", code: "21" },
    { name: "静岡県", code: "22" }, { name: "愛知県", code: "23" }, { name: "三重県", code: "24" },
    { name: "滋賀県", code: "25" }, { name: "京都府", code: "26" }, { name: "大阪府", code: "27" },
    { name: "兵庫県", code: "28" }, { name: "奈良県", code: "29" }, { name: "和歌山県", code: "30" },
    { name: "鳥取県", code: "31" }, { name: "島根県", code: "32" }, { name: "岡山県", code: "33" },
    { name: "広島県", code: "34" }, { name: "山口県", code: "35" }, { name: "徳島県", code: "36" },
    { name: "香川県", code: "37" }, { name: "愛媛県", code: "38" }, { name: "高知県", code: "39" },
    { name: "福岡県", code: "40" }, { name: "佐賀県", code: "41" }, { name: "長崎県", code: "42" },
    { name: "熊本県", code: "43" }, { name: "大分県", code: "44" }, { name: "宮崎県", code: "45" },
    { name: "鹿児島県", code: "46" }, { name: "沖縄県", code: "47" }
];

const getScaleNumber = (scale) => {
    const scaleMap = {
        10: 1,
        20: 2,
        30: 3,
        40: 4,
        45: 5,
        50: 5.5,
        55: 6,
        60: 6.5,
        70: 7
    };
    return scaleMap[scale] || 0;
};

const createRequest = async (input, callback) => {
    console.log('Input received:', JSON.stringify(input, null, 2));

    try {
        const validator = new Validator(input, {
            id: ['required']
        });

        const jobRunID = validator.validated.id;

        const now = new Date();
        const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const today = jstDate.toISOString().split('T')[0].replace(/-/g, '');

        const params = {
            since_date: today,
            until_date: today,
            limit: 100,
            order: -1
        };

        console.log('Using parameters:', params);

        const response = await axios.get('https://api.p2pquake.net/v2/jma/quake', {
            params,
            timeout: 10000
        });

        if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Invalid response from earthquake API');
        }

        const prefectureSummary = {};
        PREFECTURES.forEach(pref => {
            prefectureSummary[pref.name] = {
                name: pref.name,
                prefCode: Number(pref.code),  // prefCodeを数値型に変換
                maxScale: 0,  // 初期値は0（数値型）
                maxScaleNumber: 0,
                scaleSum: 0,
                pointCount: 0,
                latestQuake: null
            };
        });

        const recentQuakes = response.data;

        recentQuakes.forEach(quake => {
            (quake.points || []).forEach(point => {
                const pref = point.pref;
                const scaleNum = getScaleNumber(point.scale);

                if (pref && prefectureSummary[pref]) {
                    prefectureSummary[pref].scaleSum += scaleNum;
                    prefectureSummary[pref].pointCount++;

                    if (scaleNum > prefectureSummary[pref].maxScaleNumber) {
                        prefectureSummary[pref].maxScaleNumber = scaleNum;
                        prefectureSummary[pref].maxScale = scaleNum;  // maxScaleを数値型に変更
                        prefectureSummary[pref].latestQuake = {
                            time: quake.earthquake.time,
                            location: quake.earthquake.hypocenter.name,
                            magnitude: quake.earthquake.hypocenter.magnitude,
                            depth: `${quake.earthquake.hypocenter.depth}km`
                        };
                    }
                }
            });
        });

        const prefectures = Object.values(prefectureSummary)
            .map(pref => ({
                prefCode: pref.prefCode,
                maxScale: pref.maxScale,  // maxScaleを数値型で出力
                quakeScore: pref.pointCount > 0 ?
                    Number((pref.scaleSum / pref.pointCount).toFixed(1)) : 0
            }))
            .filter(pref => pref.quakeScore > 0);

        const result = {
            summary: {
                date: today,
                affectedPrefectures: prefectures.length
            },
            prefectures: prefectures
        };

        console.log('Daily summary created:', JSON.stringify(result, null, 2));

        return callback(200, {
            jobRunID,
            data: result,
            statusCode: 200
        });

    } catch (error) {
        console.error('Error details:', error);
        return callback(500, {
            jobRunID: input.id,
            status: "errored",
            statusCode: 500,
            error: {
                name: error.name,
                message: error.message
            }
        });
    }
};

module.exports.createRequest = createRequest;
