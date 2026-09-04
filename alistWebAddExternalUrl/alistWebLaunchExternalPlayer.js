// ==UserScript==
// @name         alistWebLaunchExternalPlayer
// @name:en      alistWebLaunchExternalPlayer
// @name:zh      alistWebLaunchExternalPlayer
// @name:zh-CN   alistWebLaunchExternalPlayer
// @namespace    http://tampermonkey.net/
// @version      1.1.4
// @description  alist Web Launc hExternal Player
// @description:zh-cn alistWeb 调用外部播放器, 注意自行更改 UI 中的包括/排除,或下面的 @match
// @description:en  alist Web Launch External Player
// @license      MIT
// @author       @Chen3861229
// @github       https://github.com/bpking1/embyExternalUrl
// @match        *://*/*
// ==/UserScript==

(function () {
    'use strict';
    // 是否替换原始外部播放器
    const replaceOriginLinks = true;
    // 是否使用内置的 Base64 图标
    const useInnerIcons = true;
    // 移除最后几个冗余的自定义开关
    const removeCustomBtns = false;
    // 以下为内部使用变量,请勿更改
    const mark = "alistWebLaunchExternalPlayer";
    const lsKeys = {
        hideByOS: `${mark}-hideByOS`,
        notCurrentPot: `${mark}-notCurrentPot`,
    };
    let links = [];

    // helper: 规范化 data URI（去掉前后空白与所有换行/缩进）
    function normalizeDataUri(url) {
        if (!url) return url;
        // trim 前后空白，然后移除内部所有空白字符（换行/制表/多空格）
        return url.trim().replace(/\s+/g, '');
    }

    async function init() {
        const playLinksWrapperEle = getShowEle();
        const linksEle = playLinksWrapperEle.getElementsByTagName("a");
        const oriLinkEle = linksEle[0];
        if (!oriLinkEle) {
            console.warn(`not have oriLinkEle, skip`);
            return;
        }

        const iconBaseUrl = "https://fastly.jsdelivr.net/gh/bpking1/embyExternalUrl@main/embyWebAddExternalUrl/icons";
        const diffLinks = [
            { id: "icon-StellarPlayer", title: "恒星播放器", imgSrc: `${iconBaseUrl}/icon-StellarPlayer.webp`
                , getSrc: getStellarPlayerUrl, osCheck: [OS.isWindows, OS.isMacOS, OS.isAndroid], },
            { id: "icon-MPV", title: "MPV", imgSrc: `${iconBaseUrl}/icon-MPV.webp`, getSrc: getMPVUrl, },
            { id: "icon-DDPlay", title: "弹弹Play", imgSrc: `${iconBaseUrl}/icon-DDPlay.webp`
                , getSrc: getDDPlayUrl, osCheck: [OS.isWindows, OS.isAndroid], },
            { id: "icon-SenPlayer", title: "SenPlayer", imgSrc: `${iconBaseUrl}/icon-SenPlayer.webp`
                , getSrc: getSenPlayerUrl, osCheck: [OS.isIOS], },
            { id: "icon-Copy", title: "复制串流地址", imgSrc: `${iconBaseUrl}/icon-Copy.webp`
                , getSrc: (mediaInfo) => encodeURI(mediaInfo.streamUrl), },
        ];
        const sameLinks = [
            { id: "icon-IINA", title: "IINA", imgSrc: `${iconBaseUrl}/icon-IINA.webp`
                , getSrc: getIINAUrl, osCheck: [OS.isMacOS], },
            { id: "icon-PotPlayer", title: "Potplayer", imgSrc: `${iconBaseUrl}/icon-PotPlayer.webp`
                , getSrc: getPotUrl, osCheck: [OS.isWindows], },
            { id: "icon-VLC", title: "VLC", imgSrc: `${iconBaseUrl}/icon-VLC.webp`, getSrc: getVlcUrl, },
            { id: "icon-NPlayer", title: "NPlayer", imgSrc: `${iconBaseUrl}/icon-NPlayer.webp`, getSrc: getNPlayerUrl, },
            { id: "icon-infuse", title: "Infuse", imgSrc: `${iconBaseUrl}/icon-infuse.webp`
                , getSrc: getInfuseUrl, osCheck: [OS.isApple], },
            { id: "icon-MXPlayer", title: "MXPlayer", imgSrc: `${iconBaseUrl}/icon-MXPlayer.webp`
                , getSrc: getMXUrl, osCheck: [OS.isAndroid], },
            { id: "icon-MXPlayerPro", title: "MXPlayerPro", imgSrc: `${iconBaseUrl}/icon-MXPlayerPro.webp`
                , getSrc: getMXProUrl, osCheck: [OS.isAndroid], },
            { id: "icon-Fileball", title: "Fileball", imgSrc: `${iconBaseUrl}/icon-Fileball.webp`
                , getSrc: getFileballUrl, osCheck: [OS.isApple], },
            { id: "icon-OmniPlayer", title: "OmniPlayer", imgSrc: `${iconBaseUrl}/icon-OmniPlayer.webp`
                , getSrc: getOmniPlayerUrl, osCheck: [OS.isMacOS], },
            { id: "icon-FigPlayer", title: "FigPlayer", imgSrc: `${iconBaseUrl}/icon-FigPlayer.webp`
                , getSrc: getFigPlayerUrl, osCheck: [OS.isMacOS], },
        ];
        const customBtns = [
            { id: "hideByOS", title: "异构播放器", imgSrc: '',  onClick: hideByOSHandler, },
            { id: "notCurrentPot", title: "多开Potplayer", imgSrc: '',  onClick: notCurrentPotHandler, },
        ];
        if (!removeCustomBtns) {
            diffLinks.push(...customBtns);
        }
        links = replaceOriginLinks ? [...sameLinks, ...diffLinks] : [...diffLinks];
        if (useInnerIcons) {
            // add icons from Base64, script inner, this script size 13.5KB to 64KB
            const iconsExt = getIconsExt();
            links.forEach(link => {
                const iconExt = iconsExt.find(icon => icon.id === link.id);
                if (iconExt) {
                    // 规范化 data URI（去掉换行/缩进等）
                    link.imgSrc = normalizeDataUri(iconExt.url);
                }
            });
        }

        // 用 DOM API 创建节点，避免 HTML 插入导致属性被解析时带入换行
        const insertLinks = (links, container) => {
            links.forEach(link => {
                const a = document.createElement('a');
                a.id = link.id;
                a.href = '';
                a.title = link.title || '';
                a.className = link.className || '';
                if (link.imgSrc) {
                    const img = document.createElement('img');
                    img.src = normalizeDataUri(link.imgSrc);
                    img.style.pointerEvents = 'none';
                    a.appendChild(img);
                } else {
                    a.textContent = link.title || '';
                }
                container.appendChild(a);
            });
        };
        if (replaceOriginLinks) {
            playLinksWrapperEle.innerHTML = "";
        }
        // sameLinks always before diffLinks
        insertLinks(links, playLinksWrapperEle);
        playLinksWrapperEle.setAttribute("inited", "true");

        // fill original links properties — 在插入新节点后重新获取集合并同步 className
        const newLinksEle = playLinksWrapperEle.getElementsByTagName("a");
        const oriImgEle = oriLinkEle.children[0];
        for (let i = 0; i < newLinksEle.length; i++) {
            newLinksEle[i].className = oriLinkEle.className;
            const newImgEle = newLinksEle[i].children[0];
            if (oriImgEle) {
                if (newImgEle) {
                    newImgEle.className = oriImgEle.className;
                }
            } else {
                if (newImgEle) {
                    newImgEle.style = "height: inherit";
                }
            }
        }
        
        // get mediaInfo from original a tag href, this is IINA player, see alistWeb $edurl
        const streamUrl = decodeURIComponent(decodeURIComponent(oriLinkEle.href.match(/\?(.*)$/)[1].replace("url=", "")));
        const urlObj = new URL(streamUrl);
        const filePath = decodeURIComponent(urlObj.pathname.substring(urlObj.pathname.indexOf("/d/") + 2));
        const fileName = filePath.replace(/.*[\\/]/, "");
        let subUrl = "";
        const token = localStorage.getItem("token");
        if (token) {
            const alistRes = await fetchAlistApi(`${urlObj.origin}/api/fs/get`, filePath, token);
            if (alistRes.related) {
                const subFileName = findSubFileName(alistRes.related);
                if (subFileName) {
                    subUrl = `${urlObj.protocol}//${urlObj.host}${encodeURIComponent(streamUrl.replace(alistRes.name, subFileName))}`;
                }
            }
        } else {
            console.warn(`localStorage not have token, maybe is not this site owner, skip subtitles process`);
        }

        const mediaInfo = {
            title: fileName,
            streamUrl,
            subUrl,
            position: 0,
        }

        console.log(`mediaInfo:`, mediaInfo);

        // add link href
        links.map(link => {
            const linkEle = document.getElementById(link.id);
            if (!linkEle) { return; }
            if (link.getSrc) {
                linkEle.href = link.getSrc(mediaInfo);
            } else if (link.onClick) {
                linkEle.onclick = (e) => {
                    e.preventDefault();
                    link.onClick(e);
                }
            }
            if (link.id === "icon-PotPlayer") {
                linkEle.onclick = (e) => {
                    e.preventDefault();
                    let url = e.target.href;
                    const notCurrentPotFlag = localStorage.getItem(lsKeys.notCurrentPot) === "1";
                    if (notCurrentPotFlag) {
                        url = url.replace("/current", "");
                    }
                    writeClipboard(url).then(() => {
                        console.log("成功写入剪切板真实深度链接: ", url);
                        url = `potplayer://${notCurrentPotFlag ? "" : "/current"}/clipboard`;
                        window.open(url, "_self");
                    });
                }
            } else if (link.id === "icon-Copy") {
                linkEle.onclick = (e) => {
                    e.preventDefault();
                    copyUrl(mediaInfo, e.target);
                }
            }
        });
        if (!removeCustomBtns) {
            hideByOSHandler();
            notCurrentPotHandler();
        }
    }

    // copy from /embyWebAddExternalUrl/iconsExt.js, 如果更改了以下内容,请同步更改 ./iconsExt
    function getIconsExt() {
        // base64 data total size 72.5 KB from embyWebAddExternalUrl/icons/min, sync modify
        const iconsExt = [
            { id: "icon-PotPlayer", url: `
                data:image/webp;base64,UklGRm4PAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSJMGAAABoIZs2+pG4uVwOIRQwuCWWQ3jMwyl6+7j7jMopWsllDFKGQ2Dl7K+Jay7bxkp6zLGSiglhJEQQimlZK2EUkI4HN4f8XO+731+LUTEBJBu[...]
            ` },
            { id: "icon-VLC", url: `
                data:image/webp;base64,UklGRkwOAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSDsHAAABoIZt/9lY6jnXYG3btm0bx7attXdnZ21bn2zbttFO08ymTPJP0qaZNPmtZtr88ft9jQhJkiQpkqQusnZapljID6SUXdvW029/+aNfKpVf[...]
            ` },
            { id: "icon-IINA", url: `
                data:image/webp;base64,UklGRtoPAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSN8HAAABGUVtG0nq8Qx/xDOzCyGi/xMASFIXL2y2/7gawxEIJO2PvkBEpG4pt20r27LWaZ+7dP8gQoNGc3dr3txd/vDrenBJp0ZMwAT437btmCNt[...]
            ` },
            { id: "icon-NPlayer", url: `
                data:image/webp;base64,UklGRj4OAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSJwGAAAB8IZt26HXtrVdcZoVNNtmt23btm3btm2z2baNpLm1oG0trT11F+5zeCRVd13n34iYAKn7vAFn3vX+39NnT/njnbtP65UnZDc4/MXJNfhf[...]
            ` },
            { id: "icon-MXPlayer", url: `
                data:image/webp;base64,UklGRv4PAABXRUJQVlA4TPIPAAAv/8A/EPX43v9ZtRNt2/ofjydL5hxjrhXHIQmnC3L6eeJ7DnsOW+3ujkfXqqqxu9rSwQkW0hzuzsQSHBYuCZwLDYPCbebETrSRM5wSbNtW28bzH0djSR/evfcrIBcMJUOY[...]
            ` },
            { id: "icon-MXPlayerPro", url: `
                data:image/webp;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABsSFBcUERsXFhceHBsgKEIrKCUlKFE6PTBCYFVlZF9VXVtqeJmBanGQc1tdhbWGkJ6jq62rZ4C8ybqmx5moq6T/2wBDARweHigjKE4rK06kbl1upKSkpKSkpKSk[...]
            ` },
            { id: "icon-infuse", url: `
                data:image/webp;base64,UklGRjARAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSM0GAAABGQVtJCk5pvVv+B4sRPQ/CERE7pDVPIn/zCd0BfAFOAIBgv9wEiIi8ZJuAkmb9c+//RETkJj//z8nSdLr9Y3I6bKr3aXMsW2ba9unPe0f[...]
            ` },
            { id: "icon-StellarPlayer", url: `
                data:image/webp;base64,UklGRjgNAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSDUCAAABkLtt2/E3d2xMteKxdhtrrCe7/4Htdosx1W4n225Xd4v5M6LvCT8F9/hFxATA4NTd1W+aZAzf9KZ6dyqGbeiKS7VCYe2lFaHDYV5pqxDZ[...]
            ` },
            { id: "icon-MPV", url: `
                data:image/webp;base64,UklGRqYTAABXRUJQVlA4WAoAAAAQAAAA4AAA4AAAQUxQSAUGAAABoMZq2/K2uSUnhVhWMSCXGVxmCJSZU7nMzNxuy+qSh6m8MlpZSR7zVmbmNlMZ5TEm0pifH6bP3/e+zzNWREwANJhCcbWB/QntRz0Zn76l[...]
            ` },
            { id: "icon-DDPlay", url: `
                data:image/webp;base64,UklGRjgRAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSPQEAAABGTNt26i7zR9xriGI6P8EyPlzOQpHQdoGzOZf91cQEQkG/CiSZNt23WSf95Nsg4Jzdgs8AJj/gDIoS/z3Dql/my9iAiaAsrZta9voeX+R[...]
            ` },
            { id: "icon-Fileball", url: `
                data:image/webp;base64,UklGRvYHAABXRUJQVlA4WAoAAAAIAAAAsQEAsQEAVlA4IHQHAADQUwCdASqyAbIBPpVKoUojJCGhI3MYQIgSielu4XaV7mICm/0mvQdw/K/nJdzvB/OjoH9XPgHQz6C/vD9wD9QOkL5hP24/YD3qP8z6qf9B[...]
            ` },
            { id: "icon-SenPlayer", url: `
                data:image/webp;base64,UklGRhIOAABXRUJQVlA4WAoAAAAIAAAAsQEAsQEAVlA4IJANAAAQaACdASqyAbIBPpVKoUqjIikiodDIuSgSielu4XSg/qFf5juoQwdw/uv7Wf1/qE+AfE/U8Hp9LPgrPf6HPMG/UD/i/4b39+iDzB/tv6sP[...]
            ` },
            { id: "icon-OmniPlayer", url: `
                data:image/webp;base64,UklGRnQPAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSJ0HAAAN18UgkqRGzBxgAv8+Mx8URMx/pvhFWMI7QRjCJmSYoQsKmBUadRTQQKYgbEIPeCecwg/wuG2bIUn+/91PRGa5mmNPj23btvXyvry2MVjb[...]
            ` },
            { id: "icon-FigPlayer", url: `
                data:image/webp;base64,UklGRq4PAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSNoHAAAN58WgkSRF171HPs6/R3h+BRHznyl+F95qYavAWTNA2EMQBGF2mAEz4IUmDuF/WNz+z5Ak6fuLyMyqRrWrx7Zn7ta2be+e17at4Y5ts12Z[...]
            ` },
            { id: "icon-Copy", url: `
                data:image/webp;base64,UklGRk4FAABXRUJQVlA4WAoAAAAQAAAA/wAA/wAAQUxQSBACAAABkJBtb9xIgmAGFYQwSBhMGTQMUgYugwwDQwgEQTAEQRAE7TmXvPr3TkRMAA20XLf96GqeT+3S6nWioZe1qafXZONRLWKe5X7jAa3dc914[...]
            ` },
        ];
        return iconsExt;
    }

    function getShowEle() {
        return document.querySelector("div.obj-box .hope-flex") // AList V3
            ?? document.querySelector(".chakra-wrap__list"); // AList V2
    }

    async function fetchAlistApi(alistApiPath, alistFilePath, alistToken, ua) {
        const alistRequestBody = {
            path: alistFilePath,
            password: "",
        };
        try {
            const response = await fetch(alistApiPath, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;charset=utf-8",
                    Authorization: alistToken,
                    "User-Agent": ua,
                },
                body: JSON.stringify(alistRequestBody),
            });
            if (!response.ok) {
                throw new Error(`fetchAlistApi response was not ok. Status: ${response.status}`);
            }
            const alistRes = await response.json();
            if (alistRes.error || alistRes.code !== 200) {
                throw new Error(`fetchAlistApi response had an error or non-200 status. Code: ${alistRes.code}`);
            }
            return alistRes.data;
        } catch (error) {
            console.error(`Error fetching API: ${error.message}`);
            throw error;
        }
    }

    function findSubFileName(related) {
        let subFileName = "";
        const subs = related.filter(o => o.type === 4);
        if (subs.length === 0) {
          console.log(`not have subs, skip`);
        } else {
            const cnSubs = subs.filter(o => o.name.match(/chs|sc|chi|cht|tc|zh/i));
            if (cnSubs.length === 0) {
                console.log(`not have cnSubs, will use first sub`);
                subFileName = subs[0].name;
            } else {
                console.log(`have cnSubs, will use first cnSub`);
                subFileName = cnSubs[0].name;
            }
        }
        return subFileName;
    }

    // URL with "intent" scheme 只支持
    // String => 'S'
    // Boolean =>'B'
    // Byte => 'b'
    // Character => 'c'
    // Double => 'd'
    // Float => 'f'
    // Integer => 'i'
    // Long => 'l'
    // Short => 's'

    // https://github.com/iina/iina/issues/1991
    function getIINAUrl(mediaInfo) {
        return `iina://weblink?url=${encodeURIComponent(mediaInfo.streamUrl)}&new_window=1`;
    }

    function getPotUrl(mediaInfo) {
        return `potplayer://${encodeURI(mediaInfo.streamUrl)} /sub=${encodeURI(mediaInfo.subUrl)} /current /title="${mediaInfo.title}"`;
    }

    // https://wiki.videolan.org/Android_Player_Intents/
    function getVlcUrl(mediaInfo) {
        // android subtitles:  https://code.videolan.org/videolan/vlc-android/-/issues/1903
        let vlcUrl = `intent:${encodeURI(mediaInfo.streamUrl)}#Intent;package=org.videolan.vlc;type=video/*;S.subtitles_location=${encodeURI(mediaInfo.subUrl)};S.title=${encodeURI(mediaInfo.title)};i.[...]
