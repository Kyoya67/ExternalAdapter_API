// test/adapter.test.js

const { assert } = require('chai');
const { createRequest } = require('../index');

describe('Earthquake Adapter', () => {
    // 全都道府県のデータを取得するテスト
    it('should return data for all prefectures', (done) => {
        const testRequest = {
            id: '1',
            data: {
                prefecture: 'all'
            }
        };

        createRequest(testRequest, (statusCode, data) => {
            assert.equal(statusCode, 200);
            assert.isNotNull(data.result);
            assert.hasAnyKeys(data.result, ['time', 'magnitude', 'maxScale']);
            done();
        });
    });

    // 特定の都道府県のデータを取得するテスト
    it('should return data for specific prefecture', (done) => {
        const testRequest = {
            id: '1',
            data: {
                prefecture: '青森県'
            }
        };

        createRequest(testRequest, (statusCode, data) => {
            assert.equal(statusCode, 200);
            assert.isNotNull(data.result);
            assert.hasAnyKeys(data.result, ['time', 'magnitude', 'maxScale']);
            done();
        });
    });

    // エラーハンドリングのテスト
    it('should handle invalid input', (done) => {
        const invalidRequest = {
            id: '1',
            // データプロパティが欠落
        };

        createRequest(invalidRequest, (statusCode, data) => {
            assert.equal(statusCode, 500);
            assert.isNotNull(data.error);
            done();
        });
    });
});