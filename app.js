const { createRequest } = require('./index');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.EA_PORT || 8080;

// リクエストのボディサイズ制限を増やす
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).json({
        jobRunID: req.body?.id || "1",
        status: "errored",
        statusCode: 500,
        error: {
            name: err.name,
            message: err.message
        }
    });
});

// リクエストロギングミドルウェア
app.use((req, res, next) => {
    console.log('Request received:', {
        method: req.method,
        path: req.path,
        body: req.body,
        headers: req.headers
    });
    next();
});

// POSTエンドポイント
app.post('/', (req, res) => {
    console.log('Processing POST request with body:', JSON.stringify(req.body, null, 2));

    createRequest(req.body, (statusCode, result) => {
        console.log('Response ready:', {
            statusCode,
            result: JSON.stringify(result, null, 2)
        });
        res.status(statusCode).json(result);
    });
});

// サーバー起動
app.listen(port, () => {
    console.log(`Earthquake External Adapter listening on port ${port}!`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
});