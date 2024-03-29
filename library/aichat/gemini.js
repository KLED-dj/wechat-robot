import fs from 'fs';
import axios from 'axios';

/**
 * 变量表
 */
const history = {};
let gemini = axios;

/**
 * 预加载
 */
export function preload() {

    gemini = axios.create({
        baseURL: 'https://googai.173371.xyz/v1beta/models',
        headers: {
            'x-goog-api-key': process.env.GOOGLE_API_KEY,
        },
        responseType: 'json',
    });

}

/**
 * 错误处理
 * @param {string} id 对象Id
 * @param {error} e 错误
 */
export function perror(id, e) {

    history[id].pop();

    if (e.response) {
        if (e.response.data) {
            if (e.response.data.error) {
                history[id] = [];
                return [
                    '发生了一个无法恢复的错误，已为你清空上下，请稍后重试。',
                    '错误信息：' + e.response.data.error.message
                ].join('\n');
            }
            return e.response.data || '发生了一个未知的接口错误，请稍后重试';
        }
        return e.response.statusText || '发生了一个未知的网络错误，请稍后重试';
    }

    return e.message || '发生了一个未知的错误，请稍后重试';

}

/**
 * AI 文本聊天
 * @param {string} id 对象Id
 * @param {string} msg 消息内容
 */
export async function chat(id, msg) {

    history[id] || (history[id] = []);
    history[id].length > 10 && history[id].splice(0, 2);

    if (/^\/[a-z]{3,7}$/.test(msg)) {
        switch (msg) {
            case '/new':
                history[id] = [];
                return '已清空上下文';
            case '/help':
                return [
                    '/ai 向机器人发送消息',
                    '/new 重置聊天上下文内容',
                    `请注意：当前上下文长度 ${history[id].length}/10，超出限制将按序忽略`
                ].join('\n');
            default:
                return '未注册指令';
        }
    }

    msg = msg.replace(/^\/ai\s/, '').trim();
    history[id].push({ role: 'user', parts: [{ text: msg }] });

    try {
        const body = { contents: history[id] };
        const resp = await gemini.post('/gemini-pro:generateContent', body);
        if (resp.data.candidates && resp.data.candidates.length > 0) {
            if (resp.data.candidates[0].content) {
                const txt = resp.data.candidates[0].content.parts[0].text;
                history[id].push({ role: 'model', parts: [{ text: txt }] });
                return txt;
            }
            return '出于某些原因，此问题无法回答';
        }
    } catch (err) {
        return perror(id, err);
    }

    return '太累了，我休息会儿。。。';

}

/**
 * AI 图片识别
 * @param {string} id 对象Id
 * @param {string} path 图片路径
 */
export async function image(id, path) {

    if (!path || !fs.existsSync(path)) {
        return '图片不存在';
    }

    try {
        const data = fs.readFileSync(path).toString('base64');
        const body = {
            contents: {
                parts: [
                    { text: '识别并描述这张图片' },
                    { inline_data: { mime_type: 'image/jpeg', data: data } }
                ]
            }
        };
        const resp = await gemini.post('/gemini-pro-vision:generateContent', body);
        if (resp.data.candidates && resp.data.candidates.length > 0) {
            if (resp.data.candidates[0].content) {
                return resp.data.candidates[0].content.parts[0].text;
            }
            return '出于某些原因，此问题无法回答';
        }
    } catch (err) {
        return perror(id, err);
    }

    return '太累了，我休息会儿。。。';

}
