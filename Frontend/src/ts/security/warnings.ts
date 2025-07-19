import { NavBar } from '../uis/widgets/NavBar.js';
import { FileUtil } from '../utils/FileUtil.js';
import { HtmlUtil } from '../utils/HtmlUtil.js';

export async function showWarning() {
    console.log(`%c `, `
        font-size: 0;
        ${!HtmlUtil.isChromium() && `line-height: 64px;` || ''}
        padding: 30px 100px;
        background: #111 url(${await FileUtil.fetchBase64(NavBar.logoUrl)}) no-repeat center;
        border: 2px solid #00bfff;
        border-radius: 10px;
    `);

    console.log(`%c
        請不要隨意執行陌生的程式碼，
        微笑棺木隨時都會使你在資訊安全方面陷入危險，
        若仍要執行，
        請確保了解程式碼之用途，
        再考慮執行。
    `.replaceAll(/\s/g, ''), `
        color: #66ccff;
        background: #111;
        font-size: 18px;
        font-family: monospace;
        line-height: 3rem;
        padding: 10px;
        border-radius: 5px;
    `);

    console.log(`%c
        再次提醒，
        微笑棺木成員隨時都在你身邊，
        不要相信微笑棺木成員的糖衣毒藥，
        務必小心、警惕！
    `.replaceAll(/\s/g, ''), `
        color: #1e90ff;
        background: #000;
        font-size: 17px;
        font-family: monospace;
        font-weight: bold;
        line-height: 3rem;
        padding: 10px;
        border-radius: 5px;
    `);
}

export function showAboutUs() {
    alert(`兩個光暈同人陣資歷將近十年的玩家踏入開發寫的示範用Server\n\n作者：\n雪姫\n不會取名字`);
}
